import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from './supabase';
import { ConversationStateManager } from './conversation-state-manager';
import { Conversation } from '../types';
import { APPOINTMENT_SETTING_CONTEXT } from './appointment-setting-context';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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
            memory: existingMemory!,
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
        return {
          success: false,
          error: result.error || 'Failed to store analysis',
          isNewAnalysis: false,
        };
      }

      // Get the updated memory record
      const updatedMemory = await ConversationStateManager.getConversationMemory(conversationId);

      return {
        success: true,
        memory: updatedMemory!,
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
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      // Build analysis prompt
      const prompt = `
${APPOINTMENT_SETTING_CONTEXT}

Analiza esta conversación completa entre un setter y un lead. Proporciona un análisis exhaustivo en formato JSON.

CONVERSACIÓN COMPLETA:
${conversationText}

Genera un análisis JSON con EXACTAMENTE esta estructura:
{
  "currentPhase": número (1-5 según las fases del script),
  "leadProfile": {
    "business_type": "tipo de negocio mencionado o null",
    "business_age": "antigüedad del negocio o null",
    "pain_points": ["lista de puntos de dolor identificados"],
    "goals": ["lista de objetivos mencionados"],
    "obstacles": ["lista de obstáculos identificados"],
    "current_situation": "descripción de la situación actual",
    "desired_situation": "descripción de la situación deseada",
    "has_shown_interest": true/false,
    "objections_raised": ["lista de objeciones mencionadas"]
  },
  "qualificationScore": {
    "score": número decimal 0.0-1.0,
    "reasoning": "explicación del score"
  },
  "conversationSummary": "resumen ejecutivo de 2-3 líneas",
  "nextSteps": ["paso 1 recomendado", "paso 2 recomendado", "paso 3 recomendado"],
  "detectedIntent": "positive_response" | "negative_response" | "question" | "price_inquiry" | "interest_expression" | "general_response",
  "lastUserMessage": "último mensaje del lead",
  "phaseTransitions": [
    {
      "from": número,
      "to": número,
      "messageIndex": número
    }
  ]
}

REGLAS IMPORTANTES:
1. currentPhase debe ser un número del 1 al 5 basado en la fase más avanzada alcanzada
2. Extrae TODA la información relevante mencionada en la conversación
3. El qualificationScore debe reflejar qué tan cualificado está el lead (0=nada, 1=totalmente)
4. Los nextSteps deben ser acciones concretas para el setter
5. Detecta TODAS las transiciones de fase que ocurrieron
6. Si no hay información para un campo, usa null o array vacío según corresponda

Responde SOLO con el JSON, sin texto adicional.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the analysis
      return {
        currentPhase: Number(analysis.currentPhase) || 1,
        leadProfile: analysis.leadProfile || {},
        qualificationScore: analysis.qualificationScore?.score || 0,
        summary: analysis.conversationSummary || 'Conversación analizada',
        nextSteps: analysis.nextSteps || [],
        detectedIntent: analysis.detectedIntent || 'general_response',
        lastUserMessage:
          analysis.lastUserMessage ||
          messages.filter(m => m.sender_type === 'Lead').pop()?.text ||
          '',
        phaseTransitions: analysis.phaseTransitions || [],
      };
    } catch (error) {
      console.error('Error generating AI analysis:', error);

      // Return minimal analysis on error
      return {
        currentPhase: 1,
        leadProfile: {},
        qualificationScore: 0,
        summary: 'Error al analizar la conversación',
        nextSteps: ['Revisar la conversación manualmente'],
        detectedIntent: 'general_response',
        lastUserMessage: messages.filter(m => m.sender_type === 'Lead').pop()?.text || '',
        phaseTransitions: [],
      };
    }
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
