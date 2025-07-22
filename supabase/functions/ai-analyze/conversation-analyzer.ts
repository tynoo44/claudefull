// Conversation Analysis Service for Edge Functions
// Migrated from src/lib/conversation-analyzer.ts

import { generateContent } from '../shared/gemini-client.ts';
import { initSupabaseClient } from '../shared/database-client.ts';
import { AIMessage } from '../shared/types.ts';

interface AnalysisResult {
  success: boolean;
  analysis?: ConversationAnalysis;
  error?: string;
  isNewAnalysis: boolean;
}

interface ConversationAnalysis {
  conversationId: string;
  leadId: string;
  currentPhase: number;
  qualificationScore: number;
  leadProfile: any;
  summary: string;
  nextSteps: string[];
  redFlags: string[];
  lastAnalysisTimestamp: string;
}

interface ConversationAnalysisParams {
  conversationId: string;
  leadId: string;
  messages: AIMessage[];
  forceReanalyze?: boolean;
}

export class ConversationAnalyzer {
  private supabase: any;

  constructor() {
    this.supabase = initSupabaseClient();
  }

  /**
   * Check if conversation needs analysis or re-analysis
   */
  async needsAnalysis(conversationId: string, messages: AIMessage[]): Promise<boolean> {
    try {
      // Get existing conversation memory
      const memory = await this.getConversationMemory(conversationId);

      if (!memory) {
        return true; // No analysis exists yet
      }

      if (!messages || messages.length === 0) {
        return false; // No messages to analyze
      }

      // Check if there are new messages since last analysis
      const lastMessageTime = new Date(Math.max(...messages.map(m => 
        new Date(m.timestamp || Date.now()).getTime()
      )));
      
      const lastAnalysisTime = new Date(memory.last_analysis_timestamp);

      return lastMessageTime > lastAnalysisTime;
    } catch (error) {
      console.error('Error checking analysis needs:', error);
      return true; // Default to analysis needed
    }
  }

  /**
   * Analyze conversation and update memory
   */
  async analyzeConversation(params: ConversationAnalysisParams): Promise<AnalysisResult> {
    try {
      // Check if analysis is needed
      if (!params.forceReanalyze && !await this.needsAnalysis(params.conversationId, params.messages)) {
        const existingMemory = await this.getConversationMemory(params.conversationId);
        return {
          success: true,
          analysis: existingMemory || undefined,
          isNewAnalysis: false
        };
      }

      // Format messages for analysis
      const formattedMessages = this.formatMessagesForAnalysis(params.messages);
      
      if (!formattedMessages || formattedMessages.trim().length === 0) {
        return {
          success: false,
          error: 'No messages to analyze',
          isNewAnalysis: false
        };
      }

      // Generate comprehensive analysis
      const analysis = await this.generateComprehensiveAnalysis(
        formattedMessages, 
        params.messages
      );

      console.log('Storing analysis results for conversation:', params.conversationId);

      // Store analysis in database
      const storageResult = await this.storeAnalysisResults({
        conversationId: params.conversationId,
        leadId: params.leadId,
        analysis,
        messages: params.messages
      });

      if (!storageResult.success) {
        console.error('Failed to store analysis:', storageResult.error);
        return {
          success: false,
          error: storageResult.error || 'Failed to store analysis',
          isNewAnalysis: false
        };
      }

      console.log('Analysis stored successfully');

      // Get updated memory
      const updatedMemory = await this.getConversationMemory(params.conversationId);

      return {
        success: true,
        analysis: updatedMemory || analysis,
        isNewAnalysis: true
      };

    } catch (error) {
      console.error('Error in conversation analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isNewAnalysis: false
      };
    }
  }

  /**
   * Format messages for AI analysis
   */
  private formatMessagesForAnalysis(messages: AIMessage[]): string {
    if (!messages || messages.length === 0) {
      return '';
    }

    return messages
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      })
      .map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content || ''}`)
      .join('\n');
  }

  /**
   * Generate comprehensive analysis using AI
   */
  private async generateComprehensiveAnalysis(
    formattedMessages: string,
    originalMessages: AIMessage[]
  ): Promise<ConversationAnalysis> {
    const prompt = this.buildAnalysisPrompt(formattedMessages);
    
    try {
      const analysisText = await generateContent({
        model: 'gemini-2.5-flash',
        temperature: 0.3
      }, prompt);

      // Parse the AI analysis
      const parsedAnalysis = this.parseAnalysisResponse(analysisText);
      
      // Extract additional insights
      const currentPhase = this.detectCurrentPhase(originalMessages);
      const qualificationScore = this.calculateQualificationScore(originalMessages, parsedAnalysis);
      const leadProfile = this.extractLeadProfile(originalMessages);

      return {
        conversationId: '', // Will be set by caller
        leadId: '', // Will be set by caller
        currentPhase,
        qualificationScore,
        leadProfile,
        summary: parsedAnalysis.summary || 'Conversation analysis completed',
        nextSteps: parsedAnalysis.nextSteps || [],
        redFlags: parsedAnalysis.redFlags || [],
        lastAnalysisTimestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      throw new Error(`Analysis generation failed: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(conversationText: string): string {
    return `Analiza esta conversación entre un setter de citas y un lead potencial usando la metodología Quantum Creators de 5 fases:

METODOLOGÍA QUANTUM CREATORS:
1. SITUACIÓN ACTUAL - Entender dónde está el lead ahora
2. DOLOR - Identificar frustraciones y problemas  
3. SITUACIÓN DESEADA - Descubrir objetivos y metas
4. OBSTÁCULO - Encontrar qué les impide llegar ahí
5. OFERTA - Presentar la llamada como solución

CONVERSACIÓN:
${conversationText}

Proporciona un análisis estructurado:

## RESUMEN EJECUTIVO
[Resumen de 2-3 líneas sobre el lead y la conversación]

## FASE ACTUAL
[Número de fase (1-5) y explicación]

## INFORMACIÓN RECOPILADA
### Situación Actual:
[Qué se sabe sobre la situación actual del lead]

### Dolor Identificado:
[Problemas y frustraciones expresadas]

### Situación Deseada:
[Objetivos y metas del lead]

### Obstáculos:
[Barreras identificadas]

### Oferta Discutida:
[Si se ha presentado la llamada]

## PRÓXIMOS PASOS
- [Paso 1]
- [Paso 2]
- [Paso 3]

## BANDERAS ROJAS
- [Si hay alguna señal de alerta]

## PERFIL DEL LEAD
- Tipo de negocio: [youtube/ecommerce/servicio/otro]
- Estilo de comunicación: [formal/informal/casual]
- Nivel de urgencia: [alto/medio/bajo]
- Probabilidad de cierre: [alta/media/baja]

Responde de manera natural y útil para el setter.`;
  }

  /**
   * Parse AI analysis response
   */
  private parseAnalysisResponse(analysisText: string): any {
    try {
      const sections = {
        summary: '',
        nextSteps: [] as string[],
        redFlags: [] as string[]
      };

      // Extract summary
      const summaryMatch = analysisText.match(/## RESUMEN EJECUTIVO\s*\n([^\n#]+)/i);
      if (summaryMatch) {
        sections.summary = summaryMatch[1].trim();
      }

      // Extract next steps
      const nextStepsMatch = analysisText.match(/## PRÓXIMOS PASOS\s*\n((?:- [^\n]+\n?)+)/i);
      if (nextStepsMatch) {
        sections.nextSteps = nextStepsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(2));
      }

      // Extract red flags
      const redFlagsMatch = analysisText.match(/## BANDERAS ROJAS\s*\n((?:- [^\n]+\n?)+)/i);
      if (redFlagsMatch) {
        sections.redFlags = redFlagsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(2));
      }

      return sections;
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return {
        summary: analysisText.substring(0, 200) + '...',
        nextSteps: ['Continue conversation based on analysis'],
        redFlags: []
      };
    }
  }

  /**
   * Detect current conversation phase
   */
  private detectCurrentPhase(messages: AIMessage[]): number {
    if (messages.length === 0) return 1;
    
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase());
    
    const allText = userMessages.join(' ');

    // Phase detection logic
    if (allText.includes('reunion') || allText.includes('llamada') || allText.includes('hablar')) {
      return 5;
    }
    if (allText.includes('problema') || allText.includes('frustra') || allText.includes('dificulta')) {
      return 2;
    }
    if (allText.includes('quiero') || allText.includes('objetivo') || allText.includes('lograr')) {
      return 3;
    }
    if (allText.includes('pero') || allText.includes('sin embargo') || allText.includes('no puedo')) {
      return 4;
    }
    
    return Math.min(Math.floor(messages.length / 4) + 1, 5);
  }

  /**
   * Calculate qualification score
   */
  private calculateQualificationScore(messages: AIMessage[], analysis: any): number {
    let score = 0.3; // Base score
    
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');
    
    // Positive signals
    if (allText.includes('interesa') || allText.includes('me gusta')) score += 0.2;
    if (allText.includes('precio') || allText.includes('cuanto')) score += 0.15;
    if (allText.includes('cuando') || allText.includes('como procedo')) score += 0.25;
    
    // Negative signals
    if (allText.includes('no me interesa') || allText.includes('no gracias')) score -= 0.3;
    if (allText.includes('muy caro') || allText.includes('no tengo dinero')) score -= 0.2;
    
    // Length bonus (more engagement)
    if (messages.length > 10) score += 0.1;
    if (messages.length > 20) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Extract lead profile information
   */
  private extractLeadProfile(messages: AIMessage[]): any {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');
    
    return {
      business_type: this.detectBusinessType(allText),
      communication_style: this.detectCommunicationStyle(allText),
      urgency_level: this.detectUrgencyLevel(allText),
      age_group: this.detectAgeGroup(allText)
    };
  }

  private detectBusinessType(text: string): string {
    if (text.includes('youtube') || text.includes('canal')) return 'youtube';
    if (text.includes('tienda') || text.includes('ecommerce')) return 'ecommerce';
    if (text.includes('servicio') || text.includes('consultoria')) return 'service';
    return 'general';
  }

  private detectCommunicationStyle(text: string): string {
    if (text.includes('bro') || text.includes('tio') || text.includes('colega')) return 'casual';
    if (text.includes('usted') || text.includes('señor') || text.includes('estimado')) return 'formal';
    return 'neutral';
  }

  private detectUrgencyLevel(text: string): string {
    if (text.includes('urgente') || text.includes('ya') || text.includes('rapido')) return 'high';
    if (text.includes('sin prisa') || text.includes('cuando pueda')) return 'low';
    return 'medium';
  }

  private detectAgeGroup(text: string): string {
    if (text.includes('bro') || text.includes('tio') || text.includes('wey')) return 'young';
    if (text.includes('usted') || text.includes('señor') || text.includes('disculpe')) return 'mature';
    return 'adult';
  }

  /**
   * Get existing conversation memory
   */
  private async getConversationMemory(conversationId: string): Promise<ConversationAnalysis | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error getting conversation memory:', error);
        return null;
      }

      if (!data) return null;

      return {
        conversationId: data.id,
        leadId: data.lead_id,
        currentPhase: data.current_phase || 1,
        qualificationScore: data.qualification_score || 0.3,
        leadProfile: data.conversation_state?.lead_profile || {},
        summary: data.conversation_state?.summary || '',
        nextSteps: data.conversation_state?.next_steps || [],
        redFlags: data.conversation_state?.red_flags || [],
        lastAnalysisTimestamp: data.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getConversationMemory:', error);
      return null;
    }
  }

  /**
   * Store analysis results
   */
  private async storeAnalysisResults(params: {
    conversationId: string;
    leadId: string;
    analysis: ConversationAnalysis;
    messages: AIMessage[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const lastUserMessage = params.messages
        .filter(m => m.role === 'user')
        .pop()?.content || '';

      const analysisData = {
        current_phase: params.analysis.currentPhase,
        qualification_score: params.analysis.qualificationScore,
        conversation_state: {
          lead_profile: params.analysis.leadProfile,
          summary: params.analysis.summary,
          next_steps: params.analysis.nextSteps,
          red_flags: params.analysis.redFlags,
          last_analysis_timestamp: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('conversations')
        .update(analysisData)
        .eq('id', params.conversationId);

      if (error) {
        console.error('Error storing analysis results:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in storeAnalysisResults:', error);
      return { success: false, error: error.message };
    }
  }
}