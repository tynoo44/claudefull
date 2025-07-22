import { supabase } from './supabase';
import { Conversation } from '../types';

// Legacy types for backwards compatibility
export interface ConversationState {
  last_user_message: string;
  last_ai_response: string;
  last_update: string;
  total_messages: number;
  [key: string]: unknown;
}

export interface PhaseInfo {
  current_situation?: string;
  pain_points?: string[];
  desired_situation?: string;
  obstacles?: string[];
  offer_presented?: boolean;
  appointment_interest?: boolean;
  [key: string]: unknown;
}

export interface AppendConversationMemoryParams {
  conversationId: string;
  leadId: string;
  userMessage: string;
  aiResponse: string;
  currentPhase: number;
  phaseInfo?: PhaseInfo;
  detectedIntent?: string;
}

export interface AppendConversationMemoryResult {
  success: boolean;
  memory_id?: string;
  conversation_id: string;
  lead_id: string;
  current_phase: number;
  previous_phase: number;
  phase_changed: boolean;
  qualification_score: number;
  score_breakdown?: {
    phase_score: number;
    engagement_score: number;
    info_completeness: number;
  };
  error?: string;
}

/**
 * ConversationStateManager
 *
 * Service class for managing conversation state directly on the conversations table.
 */
export class ConversationStateManager {
  /**
   * Update conversation state with new message turn
   *
   * @param params - Conversation update parameters
   * @returns Promise with operation result
   */
  static async updateConversationState(
    params: AppendConversationMemoryParams,
  ): Promise<AppendConversationMemoryResult> {
    try {
      // Validate UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!params.conversationId || !uuidRegex.test(params.conversationId)) {
        console.error('[ConversationStateManager] Invalid conversationId:', params.conversationId);
        return {
          success: false,
          conversation_id: params.conversationId,
          lead_id: params.leadId,
          current_phase: params.currentPhase || 1,
          previous_phase: params.currentPhase || 1,
          phase_changed: false,
          qualification_score: 0,
          error: `Invalid conversationId: ${params.conversationId}`,
        };
      }

      if (!params.leadId || !uuidRegex.test(params.leadId)) {
        console.error('[ConversationStateManager] Invalid leadId:', params.leadId);
        return {
          success: false,
          conversation_id: params.conversationId,
          lead_id: params.leadId,
          current_phase: params.currentPhase || 1,
          previous_phase: params.currentPhase || 1,
          phase_changed: false,
          qualification_score: 0,
          error: `Invalid leadId: ${params.leadId}`,
        };
      }

      console.log('[ConversationStateManager] Calling RPC with params:', {
        p_conversation_id: params.conversationId,
        p_lead_id: params.leadId,
        p_current_phase: params.currentPhase,
        hasUserMessage: !!params.userMessage,
        hasAiResponse: !!params.aiResponse,
        phaseInfoKeys: params.phaseInfo ? Object.keys(params.phaseInfo) : [],
      });

      // Ensure phase_info is a valid JSON object
      let phaseInfo = {};
      try {
        if (params.phaseInfo && typeof params.phaseInfo === 'object') {
          // Clean the object to ensure it's JSON-serializable
          phaseInfo = JSON.parse(JSON.stringify(params.phaseInfo));
        }
      } catch (e) {
        console.error('[ConversationStateManager] Error serializing phase_info:', e);
        phaseInfo = {};
      }

      // TODO: Create a new RPC 'update_conversation_details' that operates on the conversations table
      const { data, error } = await supabase.rpc('update_conversation_details', {
        p_conversation_id: params.conversationId,
        p_lead_id: params.leadId,
        p_user_message: params.userMessage || '',
        p_ai_response: params.aiResponse || '',
        p_current_phase: params.currentPhase || 1,
        p_phase_info: phaseInfo,
        p_detected_intent: params.detectedIntent || null,
      });

      if (error) {
        console.error('Error updating conversation state:', error);
        return {
          success: false,
          conversation_id: params.conversationId,
          lead_id: params.leadId,
          current_phase: params.currentPhase,
          previous_phase: params.currentPhase,
          phase_changed: false,
          qualification_score: 0,
          error: error.message,
        };
      }

      console.log('[ConversationStateManager] RPC response:', {
        hasData: !!data,
        hasError: !!error,
        dataType: typeof data,
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : 'N/A',
      });

      // RPC functions return arrays, get first element
      const result = Array.isArray(data) ? data[0] : data;

      console.log('[ConversationStateManager] RPC result extracted:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        success: result?.success,
        error: result?.error,
        fullResult: result,
      });

      // Check if we got a valid result
      if (!result) {
        console.error('RPC function returned null/undefined result');
        return {
          success: false,
          conversation_id: params.conversationId,
          lead_id: params.leadId,
          current_phase: params.currentPhase,
          previous_phase: params.currentPhase,
          phase_changed: false,
          qualification_score: 0,
          error: 'RPC function returned no data',
        };
      }

      // Check if the RPC function itself returned an error
      if (result && !result.success) {
        console.error('RPC function returned error:', result.error);
        console.error('Full result object:', result);
        return {
          success: false,
          conversation_id: params.conversationId,
          lead_id: params.leadId,
          current_phase: params.currentPhase,
          previous_phase: params.currentPhase,
          phase_changed: false,
          qualification_score: 0,
          error: result.error || 'Unknown RPC error',
        };
      }

      // Ensure the result has the expected structure
      const finalResult: AppendConversationMemoryResult = {
        success: true,
        memory_id: result.memory_id || params.conversationId,
        conversation_id: result.conversation_id || params.conversationId,
        lead_id: result.lead_id || params.leadId,
        current_phase: result.current_phase || params.currentPhase,
        previous_phase: result.previous_phase || params.currentPhase,
        phase_changed: result.phase_changed || false,
        qualification_score: result.qualification_score || 0,
        score_breakdown: result.score_breakdown,
        error: result.error,
      };

      return finalResult;
    } catch (error) {
      console.error('Exception in updateConversationState:', error);
      return {
        success: false,
        conversation_id: params.conversationId,
        lead_id: params.leadId,
        current_phase: params.currentPhase,
        previous_phase: params.currentPhase,
        phase_changed: false,
        qualification_score: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get conversation memory data by conversation ID
   *
   * @param conversationId - UUID of the conversation
   * @returns Promise with memory data or null if not found
   */
  static async getConversationMemory(conversationId: string): Promise<Conversation | null> {
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      console.warn('Invalid conversationId provided to getConversationMemory:', conversationId);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - memory doesn't exist yet
          return null;
        }
        console.error('Error fetching conversation memory:', error);
        return null;
      }

      return data as Conversation;
    } catch (error) {
      console.error('Exception in getConversationMemory:', error);
      return null;
    }
  }

  /**
   * Creates an initial, empty memory record for a conversation.
   * This is useful for lazy initialization when a conversation is viewed for the first time.
   *
   * @param conversationId - UUID of the conversation
   * @param leadId - UUID of the lead
   * @returns Promise with the newly created memory data or null on failure
   */
  static async createInitialMemory(
    conversationId: string,
    leadId: string,
  ): Promise<Conversation | null> {
    try {
      const result = await this.updateConversationState({
        conversationId,
        leadId,
        userMessage: '', // No initial message from user
        aiResponse: 'Conversation initialized.', // System message
        currentPhase: 1, // Start at phase 1
      });

      if (result.success && result.memory_id) {
        // Fetch the newly created record to return the full object
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', result.conversation_id)
          .single();

        if (error) {
          console.error('Failed to fetch newly created memory:', error);
          return null;
        }
        return data as Conversation;
      } else {
        console.error('Failed to create initial memory record:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Exception in createInitialMemory:', error);
      return null;
    }
  }

  /**
   * Get conversation memory data by lead ID
   *
   * @param leadId - UUID of the lead
   * @returns Promise with memory data or null if not found
   */
  static async getConversationMemoryByLead(leadId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - memory doesn't exist yet
          return null;
        }
        console.error('Error fetching conversation memory by lead:', error);
        return null;
      }

      return data as Conversation;
    } catch (error) {
      console.error('Exception in getConversationMemoryByLead:', error);
      return null;
    }
  }

  /**
   * Calculate qualification score for a conversation
   * Helper method for backwards compatibility
   *
   * @param currentPhase - Current sales phase (1-5)
   * @param conversationState - State of the conversation
   * @param phaseInfo - Information collected per phase
   * @returns Promise with calculated score
   */
  static async calculateQualificationScore(
    currentPhase: number,
    conversationState: ConversationState,
    phaseInfo: PhaseInfo,
  ): Promise<number> {
    try {
      // Use the new RPC function
      const contentLength =
        (conversationState.last_user_message || '').length +
        (conversationState.last_ai_response || '').length;

      const { data, error } = await supabase.rpc('calculate_conversation_qualification_score', {
        p_current_phase: currentPhase,
        p_content_length: contentLength,
        p_phase_info: phaseInfo,
      });

      if (error) {
        console.error('Error calculating qualification score:', error);
        return 0.0;
      }

      return data as number;
    } catch (error) {
      console.error('Exception in calculateQualificationScore:', error);
      return 0.0;
    }
  }

  /**
   * Get conversations by qualification score range
   * Useful for analytics and lead prioritization
   *
   * @param minScore - Minimum qualification score
   * @param maxScore - Maximum qualification score
   * @returns Promise with array of memory records
   */
  static async getConversationsByScore(
    minScore: number,
    maxScore: number = 1.0,
  ): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .gte('qualification_score', minScore)
        .lte('qualification_score', maxScore)
        .order('qualification_score', { ascending: false });

      if (error) {
        console.error('Error fetching conversations by score:', error);
        return [];
      }

      return data as Conversation[];
    } catch (error) {
      console.error('Exception in getConversationsByScore:', error);
      return [];
    }
  }

  /**
   * Get phase distribution statistics
   * Updated to work with the merged conversations table
   *
   * @param leadId - Optional lead ID for specific analysis
   * @returns Promise with phase statistics
   */
  static async getPhaseStats(leadId?: string): Promise<{ [key: string]: number }> {
    try {
      let query = supabase.from('conversations').select('current_phase, qualification_score');

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching phase stats:', error);
        return {};
      }

      // Process phase statistics
      const stats: { [key: string]: number } = {};

      data.forEach((record: Record<string, unknown>) => {
        const phaseKey = `current_phase_${record.current_phase}`;
        stats[phaseKey] = (stats[phaseKey] || 0) + 1;

        // Score range statistics
        const score =
          typeof record.qualification_score === 'number' ? record.qualification_score : 0;
        if (score >= 0.8) stats['high_score'] = (stats['high_score'] || 0) + 1;
        else if (score >= 0.5) stats['medium_score'] = (stats['medium_score'] || 0) + 1;
        else stats['low_score'] = (stats['low_score'] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Exception in getPhaseStats:', error);
      return {};
    }
  }

  /**
   * Delete conversation memory record
   * Use with caution - this will remove all memory data
   *
   * @param conversationId - UUID of the conversation
   * @returns Promise with success boolean
   */
  static async deleteConversationMemory(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation memory:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in deleteConversationMemory:', error);
      return false;
    }
  }
}

export default ConversationStateManager;
