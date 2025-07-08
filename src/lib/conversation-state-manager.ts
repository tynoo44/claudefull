import { supabase } from './supabase';

// Types for conversation memory system
export interface ConversationMemory {
  id: string;
  lead_id: string;
  conversation_id: string | null;
  current_phase: number;
  lead_profile: Record<string, any>;
  qualification_score: {
    score: number;
    breakdown: {
      phase_score: number;
      engagement_score: number;
      info_completeness: number;
    };
    last_update: string;
  };
  conversation_summary: string;
  next_steps: string[] | null;
  objections_raised: string[] | null;
  last_interaction: string;
  created_at: string;
  updated_at: string;
}

// Legacy types for backwards compatibility
export interface ConversationState {
  last_user_message: string;
  last_ai_response: string;
  last_update: string;
  total_messages: number;
  [key: string]: any;
}

export interface PhaseInfo {
  current_situation?: string;
  pain_points?: string[];
  desired_situation?: string;
  obstacles?: string[];
  offer_presented?: boolean;
  appointment_interest?: boolean;
  [key: string]: any;
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
 * Service class for managing conversation state and memory using the conversation_memory table.
 * Provides backwards compatibility with the original conversation_tracking interface.
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
      const { data, error } = await supabase.rpc('append_to_conversation_memory', {
        p_conversation_id: params.conversationId,
        p_lead_id: params.leadId,
        p_user_message: params.userMessage,
        p_ai_response: params.aiResponse,
        p_current_phase: params.currentPhase,
        p_phase_info: params.phaseInfo || {},
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

      return data as AppendConversationMemoryResult;
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
  static async getConversationMemory(conversationId: string): Promise<ConversationMemory | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - memory doesn't exist yet
          return null;
        }
        console.error('Error fetching conversation memory:', error);
        return null;
      }

      return data as ConversationMemory;
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
  ): Promise<ConversationMemory | null> {
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
          .from('conversation_memory')
          .select('*')
          .eq('id', result.memory_id)
          .single();

        if (error) {
          console.error('Failed to fetch newly created memory:', error);
          return null;
        }
        return data as ConversationMemory;
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
  static async getConversationMemoryByLead(leadId: string): Promise<ConversationMemory | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
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

      return data as ConversationMemory;
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
  ): Promise<ConversationMemory[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .gte('qualification_score->score', minScore)
        .lte('qualification_score->score', maxScore)
        .order('qualification_score->score', { ascending: false });

      if (error) {
        console.error('Error fetching conversations by score:', error);
        return [];
      }

      return data as ConversationMemory[];
    } catch (error) {
      console.error('Exception in getConversationsByScore:', error);
      return [];
    }
  }

  /**
   * Get phase distribution statistics
   * Updated to work with conversation_memory table
   *
   * @param leadId - Optional lead ID for specific analysis
   * @returns Promise with phase statistics
   */
  static async getPhaseStats(leadId?: string): Promise<{ [key: string]: number }> {
    try {
      let query = supabase.from('conversation_memory').select('current_phase, qualification_score');

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

      data.forEach((record: any) => {
        const phaseKey = `current_phase_${record.current_phase}`;
        stats[phaseKey] = (stats[phaseKey] || 0) + 1;

        // Score range statistics
        const score = record.qualification_score?.score || 0;
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
      const { error } = await supabase
        .from('conversation_memory')
        .delete()
        .eq('conversation_id', conversationId);

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

  // Legacy compatibility methods
  /**
   * @deprecated Use getConversationMemory instead
   */
  static async getConversationTracking(conversationId: string) {
    const memory = await this.getConversationMemory(conversationId);
    if (!memory) return null;

    // Convert to legacy format
    return {
      id: memory.id,
      conversation_id: memory.conversation_id || conversationId,
      current_phase: memory.current_phase,
      qualification_score: memory.qualification_score.score,
      conversation_state: {
        last_user_message: '',
        last_ai_response: '',
        last_update: memory.last_interaction,
        total_messages: 0,
      },
      phase_history: [],
      phase_info: memory.lead_profile,
      last_analysis_timestamp: memory.last_interaction,
      created_at: memory.created_at,
      updated_at: memory.updated_at,
    };
  }

  /**
   * @deprecated Use getPhaseStats instead
   */
  static async getPhaseTransitionStats(conversationId?: string) {
    return this.getPhaseStats(conversationId);
  }

  /**
   * @deprecated Use deleteConversationMemory instead
   */
  static async deleteConversationTracking(conversationId: string) {
    return this.deleteConversationMemory(conversationId);
  }
}

export default ConversationStateManager;
