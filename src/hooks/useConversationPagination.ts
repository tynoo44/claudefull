import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ConversationWithDetails {
  id: string;
  lead_id: string;
  opened_at: string;
  updated_at: string;
  leads: {
    id: string;
    username: string;
    full_name: string | null;
    profile_pic: string | null;
    status: string;
    procedence: string | null;
    tags: string[];
    notes: string | null;
    followers_count: number | null;
  };
  lastMessage: {
    id: string;
    text: string;
    created_at: string;
    sender_type: string;
  } | null;
  unreadCount: number;
  hasUnansweredMessages: boolean;
}

const CONVERSATIONS_PER_PAGE = 20;
const PREFETCH_THRESHOLD = 5; // Cargar más cuando quedan 5 elementos por mostrar

export const useConversationPagination = () => {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [visibleConversations, setVisibleConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const currentPage = useRef(0);
  const loadedConversationIds = useRef(new Set<string>());
  const isInitialized = useRef(false);
  const realtimeSubscriptions = useRef<RealtimeChannel[]>([]);

  // Cargar conversaciones básicas (solo IDs y metadatos) para calcular total
  const loadConversationMetadata = useCallback(async () => {
    try {
      const { data, error, count } = await supabase
        .from('conversations')
        .select('id, lead_id, updated_at', { count: 'exact' })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setTotalCount(count || 0);
      return data || [];
    } catch (err) {
      console.error('Error loading conversation metadata:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar metadatos');
      return [];
    }
  }, []);

  // Cargar página específica de conversaciones con todos los detalles
  const loadConversationPage = useCallback(
    async (page: number, existingIds = new Set<string>()) => {
      try {
        setLoading(true);
        setError(null);

        const offset = page * CONVERSATIONS_PER_PAGE;

        // Obtener conversaciones con leads
        const { data: conversationsData, error: convError } = await supabase
          .from('conversations')
          .select(
            `
          *,
          leads!inner (
            id,
            username,
            full_name,
            profile_pic,
            status,
            procedence,
            tags,
            notes,
            followers_count
          )
        `,
          )
          .order('updated_at', { ascending: false })
          .range(offset, offset + CONVERSATIONS_PER_PAGE - 1);

        if (convError) throw convError;

        if (!conversationsData || conversationsData.length === 0) {
          setHasMore(false);
          return [];
        }

        // Filtrar conversaciones ya cargadas
        const newConversations = conversationsData.filter(conv => !existingIds.has(conv.id));

        // Cargar últimos mensajes y conteo de no leídos en paralelo
        const conversationsWithDetails = await Promise.all(
          newConversations.map(async conv => {
            try {
              const [lastMessageResult, unreadCountResult, lastUserMessageResult] =
                await Promise.all([
                  // Último mensaje
                  supabase
                    .from('messages')
                    .select('id, text, created_at, sender_type')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1),

                  // Mensajes no leídos (últimas 24 horas de leads)
                  supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('sender_type', 'Lead')
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

                  // Último mensaje del usuario (Setter)
                  supabase
                    .from('messages')
                    .select('id, created_at')
                    .eq('conversation_id', conv.id)
                    .eq('sender_type', 'Setter')
                    .order('created_at', { ascending: false })
                    .limit(1),
                ]);

              const lastMessage = lastMessageResult.data?.[0] || null;
              const lastUserMessage = lastUserMessageResult.data?.[0] || null;

              // Check if there are unanswered messages
              let hasUnansweredMessages = false;
              if (lastMessage && lastMessage.sender_type === 'Lead') {
                if (
                  !lastUserMessage ||
                  new Date(lastMessage.created_at) > new Date(lastUserMessage.created_at)
                ) {
                  hasUnansweredMessages = true;
                }
              }

              return {
                ...conv,
                lastMessage,
                unreadCount: unreadCountResult.count || 0,
                hasUnansweredMessages,
              };
            } catch (error) {
              console.error(`Error loading details for conversation ${conv.id}:`, error);
              return {
                ...conv,
                lastMessage: null,
                unreadCount: 0,
                hasUnansweredMessages: false,
              };
            }
          }),
        );

        // Actualizar IDs cargados
        conversationsWithDetails.forEach(conv => loadedConversationIds.current.add(conv.id));

        // Verificar si hay más páginas
        if (conversationsData.length < CONVERSATIONS_PER_PAGE) {
          setHasMore(false);
        }

        return conversationsWithDetails;
      } catch (err) {
        console.error('Error loading conversation page:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Inicializar carga
  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      isInitialized.current = true;
      currentPage.current = 0;
      loadedConversationIds.current.clear();

      // Cargar metadatos y primera página
      const [, firstPage] = await Promise.all([
        loadConversationMetadata(),
        loadConversationPage(0),
      ]);

      setConversations(firstPage);
      setVisibleConversations(firstPage);
      currentPage.current = 1;
    } catch (err) {
      console.error('Error initializing conversations:', err);
    }
  }, [loadConversationMetadata, loadConversationPage]);

  // Cargar más conversaciones
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    const newPage = await loadConversationPage(currentPage.current, loadedConversationIds.current);

    if (newPage.length > 0) {
      setConversations(prev => [...prev, ...newPage]);
      setVisibleConversations(prev => [...prev, ...newPage]);
      currentPage.current += 1;
    }
  }, [loading, hasMore, loadConversationPage]);

  // Verificar si necesita cargar más basado en scroll
  const checkAndLoadMore = useCallback(
    (visibleIndex: number) => {
      const remainingItems = visibleConversations.length - visibleIndex;

      if (remainingItems <= PREFETCH_THRESHOLD && hasMore && !loading) {
        loadMore();
      }
    },
    [visibleConversations.length, hasMore, loading, loadMore],
  );

  // Actualizar conversación específica
  const updateConversation = useCallback(async (conversationId: string) => {
    try {
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          leads!inner (
            id,
            username,
            full_name,
            profile_pic,
            status,
            procedence,
            tags,
            notes,
            followers_count
          )
        `,
        )
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      // Cargar último mensaje y conteo
      const [lastMessageResult, unreadCountResult, lastUserMessageResult] = await Promise.all([
        supabase
          .from('messages')
          .select('id, text, created_at, sender_type')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1),

        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'Lead')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        supabase
          .from('messages')
          .select('id, created_at')
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'Setter')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      const lastMessage = lastMessageResult.data?.[0] || null;
      const lastUserMessage = lastUserMessageResult.data?.[0] || null;

      // Check if there are unanswered messages
      let hasUnansweredMessages = false;
      if (lastMessage && lastMessage.sender_type === 'Lead') {
        if (
          !lastUserMessage ||
          new Date(lastMessage.created_at) > new Date(lastUserMessage.created_at)
        ) {
          hasUnansweredMessages = true;
        }
      }

      const updatedConversation = {
        ...conversationData,
        lastMessage,
        unreadCount: unreadCountResult.count || 0,
        hasUnansweredMessages,
      };

      // Actualizar en las listas
      setConversations(prev =>
        prev.map(conv => (conv.id === conversationId ? updatedConversation : conv)),
      );
      setVisibleConversations(prev =>
        prev.map(conv => (conv.id === conversationId ? updatedConversation : conv)),
      );
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  }, []);

  // Aplicar filtros localmente
  const applyFilters = useCallback(
    (
      searchTerm: string = '',
      statusFilter: string | null = null,
      procedenceFilter: string | null = null,
      tagFilter: string = '',
      sortBy: 'time' | 'name' | 'status' | 'unread' | 'start-date' = 'time',
      sortAscending: boolean = false,
    ) => {
      let filtered = [...conversations];

      // Aplicar filtros
      if (searchTerm) {
        filtered = filtered.filter(
          conv =>
            (conv.leads.full_name || conv.leads.username)
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            conv.lastMessage?.text?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      if (statusFilter) {
        filtered = filtered.filter(conv => conv.leads.status === statusFilter);
      }

      if (procedenceFilter) {
        filtered = filtered.filter(conv => conv.leads.procedence === procedenceFilter);
      }

      if (tagFilter) {
        filtered = filtered.filter(conv =>
          conv.leads.tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())),
        );
      }

      // Aplicar ordenamiento
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name': {
            const nameA = a.leads.full_name || a.leads.username || '';
            const nameB = b.leads.full_name || b.leads.username || '';
            comparison = nameA.localeCompare(nameB);
            break;
          }
          case 'status':
            comparison = a.leads.status.localeCompare(b.leads.status);
            break;
          case 'unread':
            // Show unanswered messages first, then by recency/age depending on direction
            if (a.hasUnansweredMessages && !b.hasUnansweredMessages) return -1;
            if (!a.hasUnansweredMessages && b.hasUnansweredMessages) return 1;
            comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            break;
          case 'start-date':
            // Sort by conversation start date
            comparison = new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime();
            break;
          case 'time':
          default:
            comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            break;
        }

        // Apply sort direction
        return sortAscending ? comparison : -comparison;
      });

      setVisibleConversations(filtered);
    },
    [conversations],
  );

  // Resetear y recargar
  const refresh = useCallback(async () => {
    isInitialized.current = false;
    currentPage.current = 0;
    loadedConversationIds.current.clear();
    setConversations([]);
    setVisibleConversations([]);
    setHasMore(true);
    setError(null);
    await initialize();
  }, [initialize]);

  // Configurar suscripciones en tiempo real
  const setupRealtimeSubscriptions = useCallback(() => {
    // Limpiar suscripciones existentes
    realtimeSubscriptions.current.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    realtimeSubscriptions.current = [];

    // Suscripción a cambios en conversaciones
    const conversationsChannel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        async payload => {
          console.log('Conversation change detected:', payload);

          if (payload.eventType === 'INSERT') {
            // Nueva conversación - recargar desde el inicio
            await refresh();
          } else if (payload.eventType === 'UPDATE') {
            // Conversación actualizada - actualizar específica
            await updateConversation(payload.new.id);
          } else if (payload.eventType === 'DELETE') {
            // Conversación eliminada - remover de la lista
            setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
            setVisibleConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
            loadedConversationIds.current.delete(payload.old.id);
          }
        },
      )
      .subscribe();

    // Suscripción a cambios en mensajes (para actualizar último mensaje)
    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async payload => {
          console.log('New message detected:', payload);

          // Actualizar la conversación que recibió el mensaje
          const conversationId = payload.new.conversation_id;
          if (loadedConversationIds.current.has(conversationId)) {
            await updateConversation(conversationId);
          }
        },
      )
      .subscribe();

    // Suscripción a cambios en leads (para actualizar datos del lead)
    const leadsChannel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        async payload => {
          console.log('Lead change detected:', payload);

          // Buscar conversaciones que usen este lead y actualizarlas
          const leadId = payload.new.id;
          const conversationsToUpdate = conversations.filter(conv => conv.lead_id === leadId);

          for (const conv of conversationsToUpdate) {
            await updateConversation(conv.id);
          }
        },
      )
      .subscribe();

    realtimeSubscriptions.current = [conversationsChannel, messagesChannel, leadsChannel];
    console.log('Realtime subscriptions configured for conversations');
  }, [conversations, refresh, updateConversation]);

  // Limpiar suscripciones
  const cleanupSubscriptions = useCallback(() => {
    realtimeSubscriptions.current.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    realtimeSubscriptions.current = [];
  }, []);

  // Inicializar al montar
  useEffect(() => {
    initialize();

    // Configurar tiempo real después de la inicialización
    const timer = setTimeout(() => {
      setupRealtimeSubscriptions();
    }, 1000);

    return () => {
      clearTimeout(timer);
      cleanupSubscriptions();
    };
  }, [initialize, setupRealtimeSubscriptions, cleanupSubscriptions]);

  return {
    conversations: visibleConversations,
    loading,
    hasMore,
    error,
    totalCount,
    loadMore,
    checkAndLoadMore,
    updateConversation,
    applyFilters,
    refresh,
    clearError: () => setError(null),
  };
};
