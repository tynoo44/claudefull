import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from './supabase';
import { ConversationStateManager } from './conversation-state-manager';
import { Conversation } from '../types';
import { APPOINTMENT_SETTING_CONTEXT } from './appointment-setting-context';

// Initialize Gemini AI
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log(
  '[ConversationAnalyzer] Gemini API Key:',
  apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT DEFINED',
);
const genAI = new GoogleGenerativeAI(apiKey);

interface AnalysisResult {
  success: boolean;
  memory?: Conversation;
  error?: string;
  isNewAnalysis: boolean;
}

interface ConversationAnalysisParams {
  conversationId: string;
  leadId: string;
  messages: Message[];
  forceReanalyze?: boolean;
}

/**
 * ConversationAnalyzer
 *
 * Service for analyzing full conversations automatically using Gemini 2.5 Pro.
 * Generates comprehensive analysis including phase detection, lead profiling,
 * qualification scoring, and next steps recommendations.
 */
export class ConversationAnalyzer {
  /**
   * Check if conversation needs analysis or re-analysis
   */
  static async needsAnalysis(conversationId: string, messages: Message[]): Promise<boolean> {
    try {
      // Get existing conversation memory
      const memory = await ConversationStateManager.getConversationMemory(conversationId);

      if (!memory) {
        // No analysis exists yet
        return true;
      }

      // Check if there are messages
      if (!messages || messages.length === 0) {
        return false;
      }

      // Get the latest message timestamp
      const latestMessageTime = new Date(
        Math.max(...messages.map(m => new Date(m.created_at).getTime())),
      );

      // Get the last analysis timestamp
      const lastAnalysisTime = new Date(memory.last_analysis_timestamp);

      // Re-analyze if new messages exist after last analysis
      return latestMessageTime > lastAnalysisTime;
    } catch (error) {
      console.error('Error checking analysis needs:', error);
      return true; // Analyze on error to be safe
    }
  }

  /**
   * Analyze a full conversation and store results
   */
  static async analyzeConversation({
    conversationId,
    leadId,
    messages,
    forceReanalyze = false,
  }: ConversationAnalysisParams): Promise<AnalysisResult> {
    try {
      // Check if analysis is needed
      if (!forceReanalyze) {
        const needsAnalysis = await this.needsAnalysis(conversationId, messages);
        if (!needsAnalysis) {
          const existingMemory =
            await ConversationStateManager.getConversationMemory(conversationId);
          return {
            success: true,
            memory: existingMemory || undefined,
            isNewAnalysis: false,
          };
        }
      }

      // Prepare messages for analysis
      const conversationText = this.formatMessagesForAnalysis(messages);

      if (!conversationText || conversationText.trim().length === 0) {
        return {
          success: false,
          error: 'No messages to analyze',
          isNewAnalysis: false,
        };
      }

      // Generate comprehensive analysis using Gemini 2.5 Pro
      const analysis = await this.generateComprehensiveAnalysis(conversationText, messages);

      // Store analysis results in conversation_memory
      console.log('[ConversationAnalyzer] Storing analysis results...');
      console.log('[ConversationAnalyzer] Analysis data:', {
        conversationId,
        leadId,
        currentPhase: analysis.currentPhase,
        hasLeadProfile: !!analysis.leadProfile,
        hasLastUserMessage: !!analysis.lastUserMessage,
        hasSummary: !!analysis.summary
      });
      
      console.log('[ConversationAnalyzer] Phase info being sent:', {
        leadProfileKeys: Object.keys(analysis.leadProfile || {}),
        leadProfileSample: JSON.stringify(analysis.leadProfile).substring(0, 200)
      });
      
      const result = await ConversationStateManager.updateConversationState({
        conversationId,
        leadId,
        userMessage: analysis.lastUserMessage || '',
        aiResponse: analysis.summary || '',
        currentPhase: analysis.currentPhase,
        phaseInfo: analysis.leadProfile,
        detectedIntent: analysis.detectedIntent,
      });

      if (!result.success) {
        console.error('[ConversationAnalyzer] Failed to store analysis:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to store analysis',
          isNewAnalysis: false,
        };
      }
      
      console.log('[ConversationAnalyzer] Analysis stored successfully');

      // Get the updated memory record
      const updatedMemory = await ConversationStateManager.getConversationMemory(conversationId);

      return {
        success: true,
        memory: updatedMemory || undefined,
        isNewAnalysis: true,
      };
    } catch (error) {
      console.error('Error in conversation analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isNewAnalysis: false,
      };
    }
  }

  /**
   * Format messages for AI analysis
   */
  private static formatMessagesForAnalysis(messages: Message[]): string {
    if (!messages || messages.length === 0) return '';

    return messages
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(msg => `${msg.sender_type}: ${msg.text || ''}`)
      .join('\n');
  }

  /**
   * Generate comprehensive analysis using Gemini AI
   */
  private static async generateComprehensiveAnalysis(
    conversationText: string,
    messages: Message[],
  ) {
    try {
      console.log('[ConversationAnalyzer] Starting generateComprehensiveAnalysis');
      console.log('[ConversationAnalyzer] Conversation text length:', conversationText.length);
      console.log('[ConversationAnalyzer] Number of messages:', messages.length);

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      // Build analysis prompt with focus on natural understanding
      const prompt = `
${APPOINTMENT_SETTING_CONTEXT}

Analiza esta conversación entre un setter y un lead como si fueras un experto en ventas observando la interacción. 
Necesito un análisis PRECISO y DETALLADO en formato JSON.

CONVERSACIÓN:
${conversationText}

IMPORTANTE: 
- Detecta la fase REAL de la conversación (no donde debería estar, sino donde ESTÁ)
- Identifica TODOS los pain points mencionados, incluso los sutiles
- Captura los objetivos tanto explícitos como implícitos
- Evalúa el nivel REAL de interés (no seas optimista, sé realista)
- Detecta resistencias o señales de desinterés

Genera un JSON con esta estructura EXACTA:
{
  "currentPhase": número (1-5 basado en el progreso REAL de la conversación),
  "phaseJustification": "explicación breve de por qué está en esa fase",
  "leadProfile": {
    "business_type": "tipo específico de negocio o null",
    "business_details": "detalles adicionales del negocio",
    "current_youtube_status": "no tiene canal|tiene canal sin resultados|tiene canal con algo de tracción|canal exitoso|null",
    "pain_points": ["dolor 1 explícito", "dolor 2 sutil", "frustración mencionada"],
    "real_goals": ["objetivo real 1", "motivación profunda detectada"],
    "stated_goals": ["lo que dice querer conseguir"],
    "obstacles": ["obstáculo 1", "barrera mencionada"],
    "budget_signals": "señales sobre capacidad de inversión",
    "commitment_level": "bajo|medio|alto|no determinado",
    "personality_type": "formal|informal|directo|evasivo|entusiasta|escéptico",
    "red_flags": ["señal preocupante 1", "posible objeción no expresada"]
  },
  "qualificationScore": {
    "score": número 0.0-1.0 (sé conservador),
    "factors": {
      "has_business": true/false,
      "shows_pain": true/false,
      "has_budget_potential": true/false,
      "shows_commitment": true/false,
      "good_fit": true/false
    },
    "reasoning": "explicación honesta del score"
  },
  "conversationQuality": {
    "setter_performance": "buena|regular|mejorable",
    "rapport_level": "alto|medio|bajo",
    "missed_opportunities": ["oportunidad perdida 1", "pregunta que debió hacer"],
    "good_moves": ["acierto del setter 1", "buena pregunta realizada"]
  },
  "nextSteps": [
    "acción específica y concreta 1",
    "alternativa si el lead no responde bien",
    "plan B si hay resistencia"
  ],
  "detectedIntent": "high_interest|moderate_interest|low_interest|just_curious|time_waster|price_shopping|not_qualified",
  "suggestedApproach": "directo|exploratorio|educativo|descalificar|nutrir_largo_plazo",
  "conversationMomentum": "ascendente|estancado|descendente",
  "estimatedCloseProbability": número 0-100,
  "lastUserMessage": "último mensaje literal del lead"
}

REGLAS CRÍTICAS:
1. Sé REALISTA con el qualification score (la mayoría de leads no superan 0.6)
2. Detecta TODAS las señales sutiles de desinterés o resistencia
3. No asumas cosas que no se han dicho explícitamente
4. Identifica oportunidades perdidas por el setter
5. Si el lead evade preguntas importantes, refléjalo

Responde SOLO con el JSON, sin explicaciones adicionales.`;

      console.log('[ConversationAnalyzer] Calling Gemini API...');
      const geminiResult = await model.generateContent(prompt);
      const response = geminiResult.response.text();
      console.log('[ConversationAnalyzer] Gemini API response received, length:', response.length);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[ConversationAnalyzer] No JSON found in response:', response.substring(0, 200));
        throw new Error('No valid JSON found in AI response');
      }

      console.log('[ConversationAnalyzer] Parsing JSON from response...');
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('[ConversationAnalyzer] Parsed analysis:', {
        hasCurrentPhase: !!analysis.currentPhase,
        hasLeadProfile: !!analysis.leadProfile,
        hasQualificationScore: !!analysis.qualificationScore,
        currentPhase: analysis.currentPhase
      });

      // Validate and enhance the analysis
      const result = {
        currentPhase: Number(analysis.currentPhase) || 1,
        leadProfile: {
          ...analysis.leadProfile,
          // Ensure arrays are properly formatted
          pain_points: Array.isArray(analysis.leadProfile?.pain_points)
            ? analysis.leadProfile.pain_points
            : [],
          real_goals: Array.isArray(analysis.leadProfile?.real_goals)
            ? analysis.leadProfile.real_goals
            : [],
          obstacles: Array.isArray(analysis.leadProfile?.obstacles)
            ? analysis.leadProfile.obstacles
            : [],
          red_flags: Array.isArray(analysis.leadProfile?.red_flags)
            ? analysis.leadProfile.red_flags
            : [],
        },
        qualificationScore: analysis.qualificationScore?.score || 0,
        summary: this.generateHumanReadableSummary(analysis),
        nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : [],
        detectedIntent: analysis.detectedIntent || 'not_qualified',
        lastUserMessage:
          analysis.lastUserMessage ||
          messages.filter(m => m.sender_type === 'Lead').pop()?.text ||
          '',
        phaseTransitions: analysis.phaseTransitions || [],
        // Additional insights
        conversationQuality: analysis.conversationQuality || {},
        suggestedApproach: analysis.suggestedApproach || 'exploratorio',
        conversationMomentum: analysis.conversationMomentum || 'estancado',
        estimatedCloseProbability: analysis.estimatedCloseProbability || 0,
      };
      
      console.log('[ConversationAnalyzer] Final analysis result:', {
        currentPhase: result.currentPhase,
        summaryLength: result.summary?.length,
        lastUserMessageLength: result.lastUserMessage?.length,
        detectedIntent: result.detectedIntent
      });
      
      return result;
    } catch (error) {
      console.error('[ConversationAnalyzer] Error generating AI analysis:', error);
      console.error(
        '[ConversationAnalyzer] Error details:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      // Return minimal analysis on error
      return {
        currentPhase: 1,
        leadProfile: {},
        qualificationScore: 0,
        summary: 'Error al analizar la conversación',
        nextSteps: ['Revisar la conversación manualmente'],
        detectedIntent: 'not_qualified',
        lastUserMessage: messages.filter(m => m.sender_type === 'Lead').pop()?.text || '',
        phaseTransitions: [],
      };
    }
  }

  /**
   * Generate human-readable summary from analysis
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static generateHumanReadableSummary(analysis: any): string {
    const { leadProfile, qualificationScore, conversationQuality } = analysis;

    let summary = `Lead en fase ${analysis.currentPhase}. `;

    if (leadProfile.business_type) {
      summary += `Negocio: ${leadProfile.business_type}. `;
    }

    if (qualificationScore.score >= 0.7) {
      summary += 'Cualificación ALTA - buen candidato. ';
    } else if (qualificationScore.score >= 0.4) {
      summary += 'Cualificación MEDIA - necesita más exploración. ';
    } else {
      summary += 'Cualificación BAJA - evaluar si vale la pena continuar. ';
    }

    if (leadProfile.pain_points?.length > 0) {
      summary += `Dolor principal: ${leadProfile.pain_points[0]}. `;
    }

    if (conversationQuality?.rapport_level === 'alto') {
      summary += 'Buena conexión establecida. ';
    } else if (conversationQuality?.rapport_level === 'bajo') {
      summary += 'Necesita mejorar la conexión. ';
    }

    return summary.trim();
  }

  /**
   * Get analysis status for UI display
   */
  static async getAnalysisStatus(
    conversationId: string,
    messages: Message[],
  ): Promise<{
    hasAnalysis: boolean;
    isOutdated: boolean;
    lastAnalysisTime?: Date;
  }> {
    try {
      const memory = await ConversationStateManager.getConversationMemory(conversationId);

      if (!memory) {
        return {
          hasAnalysis: false,
          isOutdated: false,
        };
      }

      const needsUpdate = await this.needsAnalysis(conversationId, messages);

      return {
        hasAnalysis: true,
        isOutdated: needsUpdate,
        lastAnalysisTime: new Date(memory.last_analysis_timestamp),
      };
    } catch (error) {
      console.error('Error getting analysis status:', error);
      return {
        hasAnalysis: false,
        isOutdated: false,
      };
    }
  }
}

export default ConversationAnalyzer;
