import { supabase } from '../lib/supabase';
import { generateAIResponse } from '../lib/gemini';
import { analyzeConversation } from '../lib/conversation-analyzer';
import { detectIntent } from '../lib/intent-detector';
import { analyzeLeadProfile } from '../lib/lead-personalizer';

interface AnalysisResult {
  conversation_id: string;
  lead_id: string;
  analysis_data: {
    summary: string;
    current_phase: number;
    phase_details: Record<number, PhaseDetail>;
    sentiment_timeline: SentimentPoint[];
    overall_sentiment: string;
    key_moments: KeyMoment[];
  };
  sentiment_scores: {
    overall: number;
    by_message: Array<{ message_id: string; score: number; emotion: string }>;
  };
  phase_progress: {
    [key: number]: {
      completed: boolean;
      progress: number;
      key_info: string[];
      missing_info: string[];
    };
  };
  key_insights: string[];
  warnings: string[];
  action_threads: string[];
  urgency_score: number;
  capacity_score: number;
  engagement_score: number;
}

interface PhaseDetail {
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  information_gathered: string[];
  next_steps: string[];
}

interface SentimentPoint {
  timestamp: Date;
  score: number;
  emotion: string;
}

interface KeyMoment {
  message_index: number;
  type: 'positive_shift' | 'negative_shift' | 'objection' | 'buying_signal' | 'pain_point';
  description: string;
}

class ConversationAnalysisService {
  private analysisQueue: Set<string> = new Set();
  private isRunning = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  private messageDelay = 2 * 60 * 1000; // 2 minutos

  // Iniciar el servicio de análisis
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    // Ejecutar cada 30 segundos
    this.analysisInterval = setInterval(() => {
      this.processAnalysisQueue();
    }, 30000);
    
    // Ejecutar inmediatamente
    this.processAnalysisQueue();
  }

  // Detener el servicio
  stop() {
    this.isRunning = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  // Priorizar una conversación específica
  prioritizeConversation(conversationId: string) {
    this.analysisQueue.add(conversationId);
    // Ejecutar análisis inmediatamente para conversaciones priorizadas
    this.analyzeConversation(conversationId, true);
  }

  // Procesar la cola de análisis
  private async processAnalysisQueue() {
    if (!this.isRunning) return;

    try {
      // Obtener conversaciones que necesitan análisis
      const { data: conversationsNeedingAnalysis, error } = await supabase
        .rpc('get_conversations_needing_analysis');

      if (error) {
        console.error('Error getting conversations needing analysis:', error);
        return;
      }

      if (!conversationsNeedingAnalysis || conversationsNeedingAnalysis.length === 0) {
        return;
      }

      // Procesar conversaciones en orden de prioridad
      for (const conv of conversationsNeedingAnalysis) {
        if (!this.isRunning) break;
        
        // Verificar si ha pasado suficiente tiempo desde el último mensaje
        const lastMessageTime = new Date(conv.last_message_at).getTime();
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        
        if (timeSinceLastMessage >= this.messageDelay) {
          await this.analyzeConversation(conv.conversation_id);
          // Esperar un poco entre análisis para no sobrecargar
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Error in analysis queue processing:', error);
    }
  }

  // Analizar una conversación específica
  private async analyzeConversation(conversationId: string, isPriority = false) {
    try {
      // Obtener mensajes de la conversación
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError || !messages || messages.length === 0) {
        return;
      }

      // Obtener información de la conversación y el lead
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          *,
          leads (*)
        `)
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      // Preparar mensajes para análisis
      const aiMessages = messages.map(msg => ({
        role: msg.sender_type === 'setter' ? 'assistant' : 'user',
        content: msg.text,
      }));

      // Análisis de sentimientos y emociones
      const sentimentAnalysis = this.analyzeSentiments(messages);
      
      // Análisis de intenciones del último mensaje del lead
      const leadMessages = messages.filter(m => m.sender_type === 'lead');
      const lastLeadMessage = leadMessages[leadMessages.length - 1];
      const intent = lastLeadMessage ? detectIntent(lastLeadMessage.text) : null;

      // Análisis del perfil del lead
      const leadProfile = analyzeLeadProfile(leadMessages.map(m => m.text));

      // Análisis completo de la conversación
      const conversationAnalysis = await analyzeConversation(
        aiMessages as any,
        conversation.current_phase
      );

      // Generar análisis enriquecido con IA
      const enrichedAnalysis = await this.generateEnrichedAnalysis(
        messages,
        conversation,
        conversationAnalysis,
        intent,
        leadProfile
      );

      // Guardar análisis en la base de datos
      const analysisResult: AnalysisResult = {
        conversation_id: conversationId,
        lead_id: conversation.lead_id,
        analysis_data: enrichedAnalysis.analysis_data,
        sentiment_scores: sentimentAnalysis,
        phase_progress: enrichedAnalysis.phase_progress,
        key_insights: enrichedAnalysis.key_insights,
        warnings: enrichedAnalysis.warnings,
        action_threads: enrichedAnalysis.action_threads,
        urgency_score: intent?.urgencyLevel || 5,
        capacity_score: conversationAnalysis.qualification.capacityToPay * 10,
        engagement_score: conversationAnalysis.qualification.engagementLevel * 10,
      };

      // Guardar en la base de datos
      const { error: saveError } = await supabase
        .from('conversation_analysis')
        .insert(analysisResult);

      if (saveError) {
        console.error('Error saving analysis:', saveError);
        return;
      }

      // Actualizar lead si es necesario
      await this.updateLeadFromAnalysis(conversation.lead_id, enrichedAnalysis);

      // Si es prioritario, emitir evento para actualización en tiempo real
      if (isPriority) {
        await supabase
          .from('conversations')
          .update({ 
            last_analyzed_at: new Date().toISOString() 
          })
          .eq('id', conversationId);
      }

    } catch (error) {
      console.error('Error analyzing conversation:', error);
    }
  }

  // Analizar sentimientos de los mensajes
  private analyzeSentiments(messages: any[]): any {
    const sentimentMap = {
      'muy_positivo': 1,
      'positivo': 0.5,
      'neutral': 0,
      'negativo': -0.5,
      'muy_negativo': -1
    };

    const emotionKeywords = {
      frustración: ['frustrado', 'harto', 'cansado', 'difícil', 'problema', 'no puedo'],
      entusiasmo: ['genial', 'perfecto', 'me encanta', 'increíble', 'excelente'],
      duda: ['no sé', 'quizás', 'tal vez', 'no estoy seguro', 'puede ser'],
      urgencia: ['ya', 'ahora', 'urgente', 'necesito', 'cuanto antes'],
      escepticismo: ['no creo', 'suena bien pero', 'a ver', 'veremos'],
    };

    const byMessage = messages.map(msg => {
      const text = msg.text.toLowerCase();
      let score = 0;
      let emotion = 'neutral';

      // Detectar emoción dominante
      for (const [emo, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(kw => text.includes(kw))) {
          emotion = emo;
          break;
        }
      }

      // Calcular score básico
      if (text.includes('!') || text.includes('genial') || text.includes('perfecto')) {
        score = 0.5;
      } else if (text.includes('no') || text.includes('problema') || text.includes('difícil')) {
        score = -0.5;
      }

      return {
        message_id: msg.id,
        score,
        emotion
      };
    });

    const overall = byMessage.reduce((acc, curr) => acc + curr.score, 0) / byMessage.length;

    return {
      overall,
      by_message: byMessage
    };
  }

  // Generar análisis enriquecido con IA
  private async generateEnrichedAnalysis(
    messages: any[],
    conversation: any,
    baseAnalysis: any,
    intent: any,
    leadProfile: any
  ): Promise<any> {
    const prompt = `
Analiza esta conversación de ventas y proporciona un análisis PROFESIONAL y ACCIONABLE.

CONVERSACIÓN:
${messages.map(m => `${m.sender_type}: ${m.text}`).join('\n')}

ANÁLISIS BASE:
- Fase actual: ${conversation.current_phase}
- Cualificación: ${baseAnalysis.qualification.score}
- Intención detectada: ${intent?.primaryIntent || 'general'}
- Perfil del lead: ${leadProfile.type}

NECESITO:

1. PROGRESO POR FASE (información REAL extraída, no genérica):
   - Qué información específica obtuvimos
   - Qué falta por obtener
   - Próximo paso concreto

2. KEY INSIGHTS (máximo 5, solo los importantes):
   - Información crítica para cerrar la venta
   - Puntos de dolor específicos mencionados
   - Señales de compra detectadas

3. WARNINGS (solo si son relevantes):
   - Objeciones no resueltas
   - Competencia mencionada
   - Señales de pérdida de interés

4. ACTION THREADS (hilos para explotar):
   - Temas mencionados que podemos profundizar
   - Preguntas sin responder
   - Oportunidades detectadas

Formato JSON, sin fluff, solo información ÚTIL y ESPECÍFICA.`;

    try {
      const response = await generateAIResponse({
        messages: [{
          role: 'user',
          content: prompt
        }],
        model: 'gemini-2.5-pro',
      });

      // Parsear la respuesta JSON
      return JSON.parse(response);
    } catch (error) {
      // Fallback a análisis básico si falla la IA
      return this.generateBasicAnalysis(messages, conversation, baseAnalysis);
    }
  }

  // Generar análisis básico como fallback
  private generateBasicAnalysis(messages: any[], conversation: any, baseAnalysis: any): any {
    return {
      analysis_data: {
        summary: `Conversación en fase ${conversation.current_phase}`,
        current_phase: conversation.current_phase,
        phase_details: this.generatePhaseDetails(messages, conversation.current_phase),
        sentiment_timeline: [],
        overall_sentiment: 'neutral',
        key_moments: []
      },
      phase_progress: this.generatePhaseProgress(messages, conversation.current_phase),
      key_insights: [],
      warnings: [],
      action_threads: []
    };
  }

  // Generar detalles de fases
  private generatePhaseDetails(messages: any[], currentPhase: number): Record<number, PhaseDetail> {
    const phases: Record<number, PhaseDetail> = {};
    
    for (let i = 1; i <= 5; i++) {
      phases[i] = {
        name: this.getPhaseName(i),
        status: i < currentPhase ? 'completed' : i === currentPhase ? 'in_progress' : 'not_started',
        progress: i < currentPhase ? 100 : i === currentPhase ? 50 : 0,
        information_gathered: [],
        next_steps: []
      };
    }
    
    return phases;
  }

  // Generar progreso de fases
  private generatePhaseProgress(messages: any[], currentPhase: number): any {
    const progress: any = {};
    
    for (let i = 1; i <= 5; i++) {
      progress[i] = {
        completed: i < currentPhase,
        progress: i < currentPhase ? 100 : i === currentPhase ? 50 : 0,
        key_info: [],
        missing_info: []
      };
    }
    
    return progress;
  }

  // Obtener nombre de fase
  private getPhaseName(phase: number): string {
    const phaseNames = {
      1: 'Situación Actual',
      2: 'Dolor',
      3: 'Situación Deseada',
      4: 'Obstáculo',
      5: 'Oferta'
    };
    return phaseNames[phase as keyof typeof phaseNames] || 'Desconocida';
  }

  // Actualizar lead basado en el análisis
  private async updateLeadFromAnalysis(leadId: string, analysis: any) {
    try {
      // Determinar si hay cambios significativos
      const updates: any = {};
      
      // Actualizar fase si cambió
      if (analysis.suggested_phase_change) {
        updates.current_phase = analysis.suggested_phase_change;
      }
      
      // Actualizar tags automáticos
      if (analysis.auto_tags && analysis.auto_tags.length > 0) {
        const { data: currentLead } = await supabase
          .from('leads')
          .select('tags')
          .eq('id', leadId)
          .single();
          
        const currentTags = currentLead?.tags || [];
        const newTags = [...new Set([...currentTags, ...analysis.auto_tags])];
        
        if (newTags.length > currentTags.length) {
          updates.tags = newTags;
        }
      }
      
      // Actualizar notas si hay información relevante
      if (analysis.key_insights && analysis.key_insights.length > 0) {
        const { data: insights } = await supabase
          .from('lead_insights')
          .select('*')
          .eq('lead_id', leadId)
          .single();
          
        if (!insights) {
          // Crear nuevo registro de insights
          await supabase
            .from('lead_insights')
            .insert({
              lead_id: leadId,
              business_info: analysis.business_info || {},
              pain_points: analysis.pain_points || [],
              goals: analysis.goals || [],
              personality_profile: analysis.personality_profile || {}
            });
        } else {
          // Actualizar insights existentes
          await supabase
            .from('lead_insights')
            .update({
              business_info: { ...insights.business_info, ...analysis.business_info },
              pain_points: [...new Set([...insights.pain_points, ...(analysis.pain_points || [])])],
              goals: [...new Set([...insights.goals, ...(analysis.goals || [])])],
              updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadId);
        }
      }
      
      // Actualizar el lead si hay cambios
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('leads')
          .update(updates)
          .eq('id', leadId);
      }
      
    } catch (error) {
      console.error('Error updating lead from analysis:', error);
    }
  }
}

// Exportar instancia singleton
export const conversationAnalysisService = new ConversationAnalysisService();