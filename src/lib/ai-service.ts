// AI Service Client - Secure API communication with Edge Functions
// Uses OpenAI GPT models via Supabase Edge Functions

import { supabase } from './supabase';
import { n8nIntegration } from './n8n-integration';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface GenerateResponseRequest {
  messages: AIMessage[];
  model: string;
  conversationContext?: any;
  currentPhase?: number;
  leadType?: string;
  conversationId?: string;
  leadId?: string;
  enableTracking?: boolean;
}

export interface GenerateResponseResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    phase?: number;
    score?: number;
    intent?: string;
    personalization?: any;
  };
}

export interface AnalyzeConversationRequest {
  conversationId: string;
  leadId: string;
  messages: AIMessage[];
  forceReanalyze?: boolean;
}

export interface AnalyzeConversationResponse {
  success: boolean;
  analysis?: {
    currentPhase: number;
    qualificationScore: number;
    leadProfile: any;
    summary: string;
    nextSteps: string[];
    redFlags: string[];
  };
  error?: string;
  isNewAnalysis?: boolean;
}

export interface QuickActionRequest {
  messages: AIMessage[];
  model: string;
  action: 'summarize' | 'analyze_phase' | 'suggest_messages';
  currentPhase?: number;
  leadType?: string;
}

export interface QuickActionResponse {
  success: boolean;
  result?: string;
  suggestions?: string[];
  error?: string;
}

// OpenAI GPT Models
export const AI_MODELS = {
  'gpt-5.4': 'GPT 5.4',
  'gpt-4o-mini': 'GPT-4o Mini',
} as const;

/**
 * Extract meaningful error message from Supabase Functions errors.
 * FunctionsHttpError stores the response body in .context, not .message
 */
function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) {
    // supabase-js FunctionsHttpError: actual error is in .context
    const ctx = (error as unknown as Record<string, unknown>).context;
    if (ctx) {
      if (typeof ctx === 'object' && ctx !== null) {
        const obj = ctx as Record<string, unknown>;
        if (obj.error) return String(obj.error);
        if (obj.details) return String(obj.details);
        return JSON.stringify(ctx);
      }
      return String(ctx);
    }
    // Fallback: try parsing message as JSON
    try {
      const parsed = JSON.parse(error.message);
      return parsed.error || parsed.details || error.message;
    } catch {
      return error.message;
    }
  }
  return String(error);
}

export type AIModel = keyof typeof AI_MODELS;

// Backward compatibility aliases
export const GEMINI_MODELS = AI_MODELS;
export type GeminiModel = AIModel;

/**
 * Generate AI response using secure backend
 */
export async function generateAIResponse(params: {
  messages: AIMessage[];
  model: AIModel;
  conversationContext?: any;
  currentPhase?: number;
  leadType?: string;
  conversationId?: string;
  leadId?: string;
  enableTracking?: boolean;
}): Promise<string> {
  try {
    const request: GenerateResponseRequest = {
      messages: params.messages,
      model: params.model,
      conversationContext: params.conversationContext,
      currentPhase: params.currentPhase,
      leadType: params.leadType,
      conversationId: params.conversationId,
      leadId: params.leadId,
      enableTracking: params.enableTracking ?? true,
    };

    console.log('[AI Service] Generating response via Edge Function:', {
      model: request.model,
      messageCount: request.messages.length,
      conversationId: request.conversationId,
      phase: request.currentPhase,
    });

    const { data, error } = await supabase.functions.invoke('ai-response-simple', {
      body: request,
    });

    if (error) {
      const msg = extractErrorMessage(error);
      console.error('[AI Service] Edge Function error:', msg, error);
      throw new Error(msg);
    }

    const response: GenerateResponseResponse = data;

    if (!response.success) {
      console.error('[AI Service] AI response failed:', response.error);
      throw new Error(response.error || 'AI response generation failed');
    }

    console.log('[AI Service] AI response generated successfully:', {
      phase: response.metadata?.phase,
      score: response.metadata?.score,
      intent: response.metadata?.intent,
    });

    // Send to n8n webhook
    if (n8nIntegration.isEnabled()) {
      n8nIntegration
        .onAIResponseGenerated({
          conversationId: params.conversationId,
          leadId: params.leadId,
          messages: params.messages,
          response: response.response || '',
          model: params.model,
          metadata: response.metadata,
        })
        .catch(err => console.error('[AI Service] N8N webhook error:', err));
    }

    return response.response || 'Lo siento, no pude generar una respuesta en este momento.';
  } catch (error) {
    console.error('[AI Service] Error generating AI response:', error);
    throw error;
  }
}

/**
 * Analyze conversation using secure backend
 */
export async function analyzeConversation(params: {
  conversationId: string;
  leadId: string;
  messages: AIMessage[];
  forceReanalyze?: boolean;
}): Promise<AnalyzeConversationResponse> {
  try {
    const request: AnalyzeConversationRequest = {
      conversationId: params.conversationId,
      leadId: params.leadId,
      messages: params.messages,
      forceReanalyze: params.forceReanalyze,
    };

    console.log('[AI Service] Analyzing conversation via Edge Function:', {
      conversationId: request.conversationId,
      messageCount: request.messages.length,
      forceReanalyze: request.forceReanalyze,
    });

    const { data, error } = await supabase.functions.invoke('ai-analyze-simple', {
      body: request,
    });

    if (error) {
      console.error('[AI Service] Analysis Edge Function error:', error);
      throw new Error(`Conversation analysis failed: ${error.message}`);
    }

    const response: AnalyzeConversationResponse = data;

    if (!response.success) {
      console.error('[AI Service] Conversation analysis failed:', response.error);
      return {
        success: false,
        error: response.error || 'Conversation analysis failed',
      };
    }

    console.log('[AI Service] Conversation analysis completed:', {
      isNewAnalysis: response.isNewAnalysis,
      phase: response.analysis?.currentPhase,
      score: response.analysis?.qualificationScore,
    });

    // Send to n8n webhook
    if (n8nIntegration.isEnabled() && response.success) {
      n8nIntegration
        .onConversationAnalyzed({
          conversationId: params.conversationId,
          leadId: params.leadId,
          analysis: response.analysis,
          isNewAnalysis: response.isNewAnalysis || false,
        })
        .catch(err => console.error('[AI Service] N8N webhook error:', err));
    }

    return response;
  } catch (error) {
    console.error('[AI Service] Error analyzing conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate quick actions using secure backend
 */
export const generateQuickActions = {
  summarizeConversation: async (messages: AIMessage[], model: AIModel): Promise<string> => {
    try {
      const request: QuickActionRequest = {
        messages,
        model,
        action: 'summarize',
      };

      const { data, error } = await supabase.functions.invoke('ai-quick-actions-simple', {
        body: request,
      });

      if (error) throw new Error(extractErrorMessage(error));
      const response: QuickActionResponse = data;
      if (!response.success) throw new Error(response.error || 'Summarization failed');
      return response.result || 'No se pudo generar un resumen de la conversacion.';
    } catch (error) {
      console.error('[AI Service] Error summarizing conversation:', error);
      throw error;
    }
  },

  analyzeSalesPhase: async (messages: AIMessage[], model: AIModel): Promise<string> => {
    try {
      const request: QuickActionRequest = {
        messages,
        model,
        action: 'analyze_phase',
      };

      const { data, error } = await supabase.functions.invoke('ai-quick-actions-simple', {
        body: request,
      });

      if (error) throw new Error(extractErrorMessage(error));
      const response: QuickActionResponse = data;
      if (!response.success) throw new Error(response.error || 'Phase analysis failed');
      return response.result || 'No se pudo analizar la fase de ventas.';
    } catch (error) {
      console.error('[AI Service] Error analyzing sales phase:', error);
      throw error;
    }
  },

  suggestMessages: async (
    messages: AIMessage[],
    model: AIModel,
    currentPhase?: number,
    leadType?: string,
  ): Promise<string> => {
    try {
      const request: QuickActionRequest = {
        messages,
        model,
        action: 'suggest_messages',
        currentPhase,
        leadType,
      };

      const { data, error } = await supabase.functions.invoke('ai-quick-actions-simple', {
        body: request,
      });

      if (error) throw new Error(extractErrorMessage(error));
      const response: QuickActionResponse = data;
      if (!response.success) throw new Error(response.error || 'Suggestion failed');

      if (n8nIntegration.isEnabled() && response.suggestions) {
        n8nIntegration
          .onSuggestionsGenerated({
            conversationId: undefined,
            leadId: undefined,
            suggestions: response.suggestions,
            phase: currentPhase || 1,
            leadType,
          })
          .catch(err => console.error('[AI Service] N8N webhook error:', err));
      }

      return response.result || 'No se pudieron generar sugerencias de mensajes.';
    } catch (error) {
      console.error('[AI Service] Error suggesting messages:', error);
      throw error;
    }
  },
};

/**
 * Utility function to convert messages to AI format
 */
export function convertToAIMessages(messages: any[]): AIMessage[] {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content || msg.text || '',
    timestamp: msg.timestamp || msg.created_at,
  }));
}

/**
 * Check if AI service is available
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const healthMessages: AIMessage[] = [{ role: 'user', content: 'health check' }];
    const result = await generateQuickActions.summarizeConversation(healthMessages, 'gpt-5.4');
    return typeof result === 'string' && result.length > 0;
  } catch (error) {
    console.error('[AI Service] Health check failed:', error);
    return false;
  }
}
