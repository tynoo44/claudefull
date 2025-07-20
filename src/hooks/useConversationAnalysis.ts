import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { conversationAnalysisService } from '../services/conversationAnalysisService';
import { useEffect } from 'react';

interface ConversationAnalysis {
  id: string;
  conversation_id: string;
  lead_id: string;
  analysis_data: {
    summary: string;
    current_phase: number;
    phase_details: Record<number, any>;
    sentiment_timeline: Array<{ timestamp: Date; score: number; emotion: string }>;
    overall_sentiment: string;
    key_moments: Array<any>;
  };
  sentiment_scores: {
    overall: number;
    by_message: Array<{ message_id: string; score: number; emotion: string }>;
  };
  phase_progress: Record<number, {
    completed: boolean;
    progress: number;
    key_info: string[];
    missing_info: string[];
  }>;
  key_insights: string[];
  warnings: string[];
  action_threads: string[];
  urgency_score: number;
  capacity_score: number;
  engagement_score: number;
  created_at: string;
  updated_at: string;
}

export function useConversationAnalysis(conversationId?: string) {
  const queryClient = useQueryClient();

  // Query para obtener el análisis actual
  const analysisQuery = useQuery({
    queryKey: ['conversation-analysis', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('conversation_analysis')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignorar error "no rows"
        throw error;
      }

      return data as ConversationAnalysis | null;
    },
    enabled: !!conversationId,
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refetch cada minuto
  });

  // Mutation para refrescar análisis manualmente
  const refreshAnalysisMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId) throw new Error('No conversation ID');
      
      // Priorizar esta conversación para análisis inmediato
      conversationAnalysisService.prioritizeConversation(conversationId);
      
      // Esperar un poco para que el análisis se complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refetch el análisis
      return queryClient.invalidateQueries({
        queryKey: ['conversation-analysis', conversationId]
      });
    },
    onSuccess: () => {
      // Mostrar notificación de éxito si es necesario
    }
  });

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`analysis-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_analysis',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Actualizar cache cuando hay cambios
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            queryClient.setQueryData(
              ['conversation-analysis', conversationId],
              payload.new as ConversationAnalysis
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Hook para el servicio de análisis automático
  useEffect(() => {
    // Iniciar servicio de análisis si no está corriendo
    conversationAnalysisService.start();

    // Priorizar la conversación actual
    if (conversationId) {
      conversationAnalysisService.prioritizeConversation(conversationId);
    }

    return () => {
      // No detener el servicio al desmontar, debe seguir corriendo
    };
  }, [conversationId]);

  return {
    analysis: analysisQuery.data,
    isLoading: analysisQuery.isLoading,
    error: analysisQuery.error,
    refreshAnalysis: refreshAnalysisMutation.mutate,
    isRefreshing: refreshAnalysisMutation.isPending,
    lastUpdated: analysisQuery.data?.updated_at 
      ? new Date(analysisQuery.data.updated_at)
      : null,
  };
}

// Hook para obtener el historial de conversaciones con la IA
export function useAIConversation(conversationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai-conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!conversationId,
  });

  const saveMutation = useMutation({
    mutationFn: async (messages: any[]) => {
      if (!conversationId) throw new Error('No conversation ID');

      const { data: existing } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('conversation_id', conversationId)
        .single();

      if (existing) {
        // Actualizar existente
        return supabase
          .from('ai_conversations')
          .update({
            messages,
            total_messages: messages.length,
            last_message_at: new Date().toISOString(),
          })
          .eq('conversation_id', conversationId);
      } else {
        // Crear nuevo
        return supabase
          .from('ai_conversations')
          .insert({
            conversation_id: conversationId,
            lead_id: '', // Se debe pasar desde el componente
            messages,
            total_messages: messages.length,
            last_message_at: new Date().toISOString(),
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-conversation', conversationId]
      });
    }
  });

  return {
    aiConversation: query.data,
    isLoading: query.isLoading,
    saveAIConversation: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}