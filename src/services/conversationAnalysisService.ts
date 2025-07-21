import { supabase } from '../lib/supabase';
import { generateAIResponse, DEFAULT_MODEL } from '../lib/gemini';
import ConversationAnalyzer from '../lib/conversation-analyzer';
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
  private priorityQueue: Set<string> = new Set(); // High priority conversations (currently active)
  private isRunning = false;
  private isProcessing = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  private messageDelay = 2 * 60 * 1000; // 2 minutos
  private readonly MAX_CONCURRENT_ANALYSIS = 3; // Process up to 3 conversations simultaneously
  private readonly MAX_CONCURRENT_ANALYSES = 3; // Alias for consistency
  private currentlyProcessing: Set<string> = new Set();
  private activeAnalyses: Set<string> = new Set();

  // Iniciar el servicio de análisis
  start() {
    if (this.isRunning) {
      console.log('Analysis service already running');
      return;
    }

    console.log('Starting analysis service...');
    this.isRunning = true;
    // Ejecutar cada 30 segundos
    this.analysisInterval = setInterval(() => {
      console.log('Running scheduled analysis queue processing...');
      this.processAnalysisQueue();
    }, 30000);

    // Ejecutar inmediatamente
    console.log('Running immediate analysis queue processing...');
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

  // Procesar la cola de análisis con sistema de prioridades
  private async processAnalysisQueue() {
    if (!this.isRunning) return;

    try {
      // Procesar cola de prioridad primero
      await this.processPriorityQueue();

      // Luego procesar cola normal si no estamos al límite
      if (this.currentlyProcessing.size < this.MAX_CONCURRENT_ANALYSIS) {
        await this.processNormalQueue();
      }
    } catch (error) {
      console.error('Error in analysis queue processing:', error);
    }
  }

  // Procesar conversaciones de alta prioridad (chats activos)
  private async processPriorityQueue() {
    const priorityArray = Array.from(this.priorityQueue);

    for (const conversationId of priorityArray) {
      if (!this.isRunning || this.currentlyProcessing.size >= this.MAX_CONCURRENT_ANALYSIS) break;

      if (!this.currentlyProcessing.has(conversationId)) {
        this.priorityQueue.delete(conversationId);
        this.analyzeConversation(conversationId, true); // No await - process in parallel
      }
    }
  }

  // Procesar cola normal de análisis
  private async processNormalQueue() {
    try {
      // Obtener conversaciones que necesitan análisis
      const { data: conversationsNeedingAnalysis, error } = await supabase.rpc(
        'get_conversations_needing_analysis',
      );

      if (error) {
        console.error('Error getting conversations needing analysis:', error);
        return;
      }

      if (!conversationsNeedingAnalysis || conversationsNeedingAnalysis.length === 0) {
        return;
      }

      // Procesar conversaciones que no están en procesamiento
      for (const conv of conversationsNeedingAnalysis) {
        if (!this.isRunning || this.currentlyProcessing.size >= this.MAX_CONCURRENT_ANALYSIS) break;

        const conversationId = conv.conversation_id;

        // Skip if already processing or in priority queue
        if (
          this.currentlyProcessing.has(conversationId) ||
          this.priorityQueue.has(conversationId)
        ) {
          continue;
        }

        // Verificar si ha pasado suficiente tiempo desde el último mensaje
        const lastMessageTime = new Date(conv.last_message_at).getTime();
        const timeSinceLastMessage = Date.now() - lastMessageTime;

        if (timeSinceLastMessage >= this.messageDelay) {
          this.analyzeConversation(conversationId, false); // No await - process in parallel
          // Small delay to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error in normal queue processing:', error);
    }
  }

  // Analizar una conversación específica
  private async analyzeConversation(conversationId: string, isPriority = false) {
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversationId received:', conversationId);
      console.trace(); // Show stack trace to find where this is coming from
      return;
    }

    console.log(`Starting analysis for conversation: ${conversationId}, isPriority: ${isPriority}`);

    // Mark as processing
    this.currentlyProcessing.add(conversationId);

    try {
      // Obtener mensajes de la conversación
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error(`Error fetching messages for ${conversationId}:`, messagesError);
        return;
      }

      if (!messages || messages.length === 0) {
        console.log(`No messages found for conversation ${conversationId}`);
        return;
      }

      console.log(`Found ${messages.length} messages for conversation ${conversationId}`);

      // Obtener información de la conversación y el lead
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(
          `
          *,
          leads (*)
        `,
        )
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error(`Error fetching conversation ${conversationId}:`, convError);
        return;
      }

      if (!conversation) {
        console.error(`No conversation found for ${conversationId}`);
        return;
      }

      console.log(`Conversation loaded for ${conversationId}:`, {
        id: conversation.id,
        lead_id: conversation.lead_id,
        hasLeadData: !!conversation.leads,
      });

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
      console.log(`Calling ConversationAnalyzer.analyzeConversation for ${conversationId}`);
      const conversationAnalysis = await ConversationAnalyzer.analyzeConversation({
        conversationId,
        leadId: conversation.lead_id,
        messages,
        forceReanalyze: true,
      });

      // Check if conversation analysis was successful
      if (!conversationAnalysis.success) {
        console.log(
          `ConversationAnalyzer failed for ${conversationId}: ${conversationAnalysis.error}`,
        );
        return;
      }

      console.log(`ConversationAnalyzer successful for ${conversationId}`);

      // Generar análisis enriquecido con IA usando la memoria actualizada
      const enrichedAnalysis = await this.generateEnrichedAnalysis(
        messages,
        conversation,
        conversationAnalysis.memory || null,
        intent,
        leadProfile,
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
        capacity_score: (conversationAnalysis.memory?.qualification_score?.score || 0.5) * 10,
        engagement_score: (conversationAnalysis.memory?.qualification_score?.score || 0.5) * 10,
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
            last_analyzed_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
    } finally {
      // Always remove from processing set
      this.currentlyProcessing.delete(conversationId);
      this.activeAnalyses.delete(conversationId);

      // Remove from queues if completed
      this.priorityQueue.delete(conversationId);
      this.analysisQueue.delete(conversationId);
    }
  }

  // Analizar sentimientos de los mensajes
  private analyzeSentiments(messages: { text: string; sender_type: string }[]): {
    overall: number;
    timeline: Array<{ timestamp: Date; score: number; emotion: string }>;
  } {
    const _sentimentMap = {
      muy_positivo: 1,
      positivo: 0.5,
      neutral: 0,
      negativo: -0.5,
      muy_negativo: -1,
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
        message_id: msg.id || 'unknown',
        score,
        emotion,
      };
    });

    const overall = byMessage.reduce((acc, curr) => acc + curr.score, 0) / byMessage.length;

    return {
      overall,
      by_message: byMessage,
    };
  }

  // Generar análisis enriquecido con IA
  private async generateEnrichedAnalysis(
    messages: any[],
    conversation: any,
    conversationMemory: any,
    intent: any,
    leadProfile: any,
  ): Promise<any> {
    console.log('generateEnrichedAnalysis called with:', {
      messagesCount: messages?.length,
      conversationId: conversation?.id,
      hasMemory: !!conversationMemory,
      intent: intent?.primaryIntent,
      leadProfile: leadProfile?.type,
    });

    // Validate conversation memory structure
    if (!conversationMemory) {
      console.error('No conversation memory available for enriched analysis');
      // Return a default structure
      return {
        analysis_data: {
          summary: 'Análisis básico - memoria no disponible',
          current_phase: conversation?.current_phase || 1,
          phase_details: {},
          sentiment_timeline: [],
          overall_sentiment: 'neutral',
          key_moments: [],
        },
        phase_progress: {},
        key_insights: ['Memoria de conversación no disponible'],
        warnings: ['Análisis limitado sin contexto previo'],
        action_threads: [],
      };
    }

    const prompt = `Analiza esta conversación de ventas y responde ÚNICAMENTE con un objeto JSON válido.

CONVERSACIÓN:
${messages.map(m => `${m.sender_type}: ${m.text}`).join('\n')}

CONTEXTO:
- Fase actual: ${conversation.current_phase}
- Score: ${conversationMemory.qualification_score?.score || 0}
- Intención: ${intent?.primaryIntent || 'general'}
- Perfil: ${leadProfile?.type || 'unknown'}

Responde SOLO con este JSON (sin texto adicional antes o después):

{
  "analysis_data": {
    "summary": "Resumen ejecutivo de la conversación en 1-2 líneas",
    "current_phase": ${conversation.current_phase},
    "phase_details": {
      "1": {"name": "Situación Actual", "status": "completed", "progress": 100, "information_gathered": ["info1"], "next_steps": ["step1"]},
      "2": {"name": "Dolor", "status": "in_progress", "progress": 50, "information_gathered": ["info2"], "next_steps": ["step2"]},
      "3": {"name": "Situación Deseada", "status": "not_started", "progress": 0, "information_gathered": [], "next_steps": []},
      "4": {"name": "Obstáculo", "status": "not_started", "progress": 0, "information_gathered": [], "next_steps": []},
      "5": {"name": "Oferta", "status": "not_started", "progress": 0, "information_gathered": [], "next_steps": []}
    },
    "sentiment_timeline": [],
    "overall_sentiment": "neutral",
    "key_moments": []
  },
  "phase_progress": {
    "1": {"completed": true, "progress": 100, "key_info": ["información obtenida"], "missing_info": []},
    "2": {"completed": false, "progress": 50, "key_info": ["algo detectado"], "missing_info": ["falta esto"]},
    "3": {"completed": false, "progress": 0, "key_info": [], "missing_info": ["objetivos del lead"]},
    "4": {"completed": false, "progress": 0, "key_info": [], "missing_info": ["obstáculos"]},
    "5": {"completed": false, "progress": 0, "key_info": [], "missing_info": ["presentar oferta"]}
  },
  "key_insights": [
    "Insight específico 1 extraído de la conversación real",
    "Dolor concreto mencionado por el lead",
    "Señal de compra detectada"
  ],
  "warnings": [
    "Advertencia específica solo si es relevante"
  ],
  "action_threads": [
    "Tema específico para profundizar",
    "Pregunta pendiente de responder"
  ]
}`;

    try {
      console.log('About to call generateAIResponse with DEFAULT_MODEL:', DEFAULT_MODEL);
      console.log('Prompt length:', prompt.length);

      const response = await generateAIResponse({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: DEFAULT_MODEL, // Use Gemini-2.5-Pro as default
      });

      console.log('generateAIResponse returned:', response ? `response received (${response.length} chars)` : 'no response');
      console.log('Raw response preview:', response?.substring(0, 200) + '...');

      // Try to extract JSON from response if it's not pure JSON
      let jsonContent = response;
      
      // Look for JSON pattern in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
        console.log('Extracted JSON from response, length:', jsonContent.length);
      }

      // Parsear la respuesta JSON
      const parsed = JSON.parse(jsonContent);
      console.log('Successfully parsed AI response');
      return parsed;
    } catch (error) {
      console.error('Error in generateEnrichedAnalysis:', error);
      // Fallback a análisis básico si falla la IA
      return this.generateBasicAnalysis(messages, conversation, conversationMemory);
    }
  }

  // Generar análisis básico como fallback
  private generateBasicAnalysis(
    messages: any[],
    conversation: any,
    conversationMemory: any,
  ): any {
    return {
      analysis_data: {
        summary: `Conversación en fase ${conversation.current_phase}`,
        current_phase: conversation.current_phase,
        phase_details: this.generatePhaseDetails(messages, conversation.current_phase),
        sentiment_timeline: [],
        overall_sentiment: 'neutral',
        key_moments: [],
      },
      phase_progress: this.generatePhaseProgress(messages, conversation.current_phase),
      key_insights: ['Análisis básico generado como fallback'],
      warnings: ['Análisis AI no disponible'],
      action_threads: ['Revisar manualmente la conversación'],
    };
  }

  // Generar detalles de fases
  private generatePhaseDetails(
    messages: any[],
    currentPhase: number,
  ): Record<number, PhaseDetail> {
    const phases: Record<number, PhaseDetail> = {};

    for (let i = 1; i <= 5; i++) {
      phases[i] = {
        name: this.getPhaseName(i),
        status: i < currentPhase ? 'completed' : i === currentPhase ? 'in_progress' : 'not_started',
        progress: i < currentPhase ? 100 : i === currentPhase ? 50 : 0,
        information_gathered: [],
        next_steps: [],
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
        missing_info: [],
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
      5: 'Oferta',
    };
    return phaseNames[phase as keyof typeof phaseNames] || 'Desconocida';
  }

  // Actualizar lead basado en el análisis
  private async updateLeadFromAnalysis(leadId: string, analysis: any) {
    if (!leadId || leadId === 'undefined') {
      console.error('Invalid leadId in updateLeadFromAnalysis:', leadId);
      return;
    }

    try {
      // Determinar si hay cambios significativos
      const updates: unknown = {};

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
          await supabase.from('lead_insights').insert({
            lead_id: leadId,
            business_info: analysis.business_info || {},
            pain_points: analysis.pain_points || [],
            goals: analysis.goals || [],
            personality_profile: analysis.personality_profile || {},
          });
        } else {
          // Actualizar insights existentes
          await supabase
            .from('lead_insights')
            .update({
              business_info: { ...insights.business_info, ...analysis.business_info },
              pain_points: [...new Set([...insights.pain_points, ...(analysis.pain_points || [])])],
              goals: [...new Set([...insights.goals, ...(analysis.goals || [])])],
              updated_at: new Date().toISOString(),
            })
            .eq('lead_id', leadId);
        }
      }

      // Actualizar el lead si hay cambios
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.from('leads').update(updates).eq('id', leadId);
        if (updateError) {
          console.error('Error updating lead:', updateError);
        }
      }
    } catch (error) {
      console.error('Error updating lead from analysis:', error);
    }
  }

  // Start background analysis process
  async startBackgroundAnalysis() {
    console.log('Starting background conversation analysis...');
    this.isProcessing = true;
    
    // Also ensure the old system is running
    this.start();
    
    // Start the new queue processing
    this.processQueue();
  }

  // Stop background analysis
  stopBackgroundAnalysis() {
    console.log('Stopping background conversation analysis...');
    this.isProcessing = false;
    this.analysisQueue.clear();
    this.priorityQueue.clear();
    
    // Also stop the old system
    this.stop();
  }

  // Process the analysis queue
  private async processQueue() {
    while (this.isProcessing) {
      try {
        // Check for conversations needing analysis
        const { data: conversations, error } = await supabase
          .rpc('get_conversations_needing_analysis')
          .limit(50);

        if (error) {
          console.error('Error fetching conversations for analysis:', error);
        } else if (conversations && conversations.length > 0) {
          console.log(`Found ${conversations.length} conversations needing analysis`);

          // Add to queue if not already there
          for (const conv of conversations) {
            if (!this.analysisQueue.has(conv.conversation_id)) {
              this.analysisQueue.add(conv.conversation_id);
            }
          }
        }

        // Process priority queue first (active conversations)
        const priorityArray = Array.from(this.priorityQueue);
        for (const conversationId of priorityArray) {
          if (this.activeAnalyses.size < this.MAX_CONCURRENT_ANALYSES && conversationId) {
            this.priorityQueue.delete(conversationId);
            this.analysisQueue.delete(conversationId); // Remove from normal queue if present
            this.activeAnalyses.add(conversationId);
            this.analyzeConversation(conversationId, true);
          }
        }

        // Then process normal queue
        const queueArray = Array.from(this.analysisQueue);
        for (const conversationId of queueArray) {
          if (this.activeAnalyses.size < this.MAX_CONCURRENT_ANALYSES && conversationId) {
            this.analysisQueue.delete(conversationId);
            this.activeAnalyses.add(conversationId);
            this.analyzeConversation(conversationId, false);
          }
        }

        // Wait before next check (30 seconds if queue is empty, 5 seconds if processing)
        const waitTime =
          this.analysisQueue.size === 0 && this.priorityQueue.size === 0 ? 30000 : 5000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error) {
        console.error('Error in background analysis process:', error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
      }
    }
  }

  // Prioritize a conversation for immediate analysis
  prioritizeConversation(conversationId: string) {
    this.priorityQueue.add(conversationId);
    console.log(`Prioritized conversation ${conversationId} for analysis`);
  }

  // Manually refresh analysis for a conversation
  async refreshAnalysis(conversationId: string): Promise<AnalysisResult | null> {
    if (!conversationId) {
      console.error('Cannot refresh analysis: conversationId is undefined');
      return null;
    }

    // Add validation and proper handling
    this.activeAnalyses.add(conversationId);

    try {
      // Call the private method and wait for result
      await this.analyzeConversation(conversationId, true);

      // Fetch the analysis result from database
      const { data: analysis } = await supabase
        .from('conversation_analysis')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      return analysis as AnalysisResult;
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      return null;
    } finally {
      this.activeAnalyses.delete(conversationId);
    }
  }

  // Get analysis status
  getAnalysisStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.analysisQueue.size,
      priorityQueueSize: this.priorityQueue.size,
      activeAnalyses: this.activeAnalyses.size,
      maxConcurrent: this.MAX_CONCURRENT_ANALYSES,
    };
  }
}

// Exportar instancia singleton
export const conversationAnalysisService = new ConversationAnalysisService();
