import { supabase } from './supabase';

// Types for conversation state management
export interface ConversationState {
  last_user_message: string;
  last_ai_response: string;
  last_update: string;
  total_messages: number;
  [key: string]: any;
}

export interface PhaseHistory {
  from_phase: number;
  to_phase: number;
  timestamp: string;
  trigger_message: string;
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

export interface ConversationTracking {
  id: string;
  conversation_id: string;
  current_phase: number;
  qualification_score: number;
  conversation_state: ConversationState;
  phase_history: PhaseHistory[];
  phase_info: PhaseInfo;
  last_analysis_timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface AppendConversationParams {
  conversation_id: string;
  user_message: string;
  ai_response: string;
  current_phase: number;
  phase_info?: PhaseInfo;
  detected_intent?: string;
}

export interface AppendConversationResult {
  success: boolean;
  tracking_id?: string;
  conversation_id: string;
  current_phase: number;
  previous_phase: number;
  phase_changed: boolean;
  qualification_score: number;
  total_messages: number;
  error?: string;
}

/**
 * ConversationStateManager
 * 
 * Service class for managing conversation state and tracking.
 * Encapsulates all conversation state operations using Supabase RPC functions.
 */
export class ConversationStateManager {
  /**
   * Update conversation state with new message turn
   * 
   * @param params - Conversation update parameters
   * @returns Promise with operation result
   */
  static async updateConversationState(
    params: AppendConversationParams
  ): Promise<AppendConversationResult> {
    try {
      const { data, error } = await supabase.rpc('append_to_conversation', {
        p_conversation_id: params.conversation_id,
        p_user_message: params.user_message,
        p_ai_response: params.ai_response,
        p_current_phase: params.current_phase,
        p_phase_info: params.phase_info || {},
        p_detected_intent: params.detected_intent || null
      });

      if (error) {
        console.error('Error updating conversation state:', error);
        return {
          success: false,
          conversation_id: params.conversation_id,
          current_phase: params.current_phase,
          previous_phase: params.current_phase,
          phase_changed: false,
          qualification_score: 0,
          total_messages: 0,
          error: error.message
        };
      }

      return data as AppendConversationResult;
    } catch (error) {
      console.error('Exception in updateConversationState:', error);
      return {
        success: false,
        conversation_id: params.conversation_id,
        current_phase: params.current_phase,
        previous_phase: params.current_phase,
        phase_changed: false,
        qualification_score: 0,
        total_messages: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get conversation tracking data
   * 
   * @param conversationId - UUID of the conversation
   * @returns Promise with tracking data or null if not found
   */
  static async getConversationTracking(
    conversationId: string
  ): Promise<ConversationTracking | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_tracking')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - tracking doesn't exist yet
          return null;
        }
        console.error('Error fetching conversation tracking:', error);
        return null;
      }

      return data as ConversationTracking;
    } catch (error) {
      console.error('Exception in getConversationTracking:', error);
      return null;
    }
  }

  /**
   * Calculate qualification score for a conversation
   * Helper method that uses the database function
   * 
   * @param currentPhase - Current sales phase (1-5)
   * @param conversationState - State of the conversation
   * @param phaseInfo - Information collected per phase
   * @returns Promise with calculated score
   */
  static async calculateQualificationScore(
    currentPhase: number,
    conversationState: ConversationState,
    phaseInfo: PhaseInfo
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_qualification_score', {
        p_current_phase: currentPhase,
        p_conversation_state: conversationState,
        p_phase_info: phaseInfo
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
   * @returns Promise with array of tracking records
   */
  static async getConversationsByScore(
    minScore: number,
    maxScore: number = 1.0
  ): Promise<ConversationTracking[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_tracking')
        .select('*')
        .gte('qualification_score', minScore)
        .lte('qualification_score', maxScore)
        .order('qualification_score', { ascending: false });

      if (error) {
        console.error('Error fetching conversations by score:', error);
        return [];
      }

      return data as ConversationTracking[];
    } catch (error) {
      console.error('Exception in getConversationsByScore:', error);
      return [];
    }
  }

  /**
   * Get phase transition statistics
   * Useful for analytics and process optimization
   * 
   * @param conversationId - Optional conversation ID for specific analysis
   * @returns Promise with phase transition data
   */
  static async getPhaseTransitionStats(
    conversationId?: string
  ): Promise<{[key: string]: number}> {
    try {
      let query = supabase
        .from('conversation_tracking')
        .select('phase_history, current_phase');

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching phase transition stats:', error);
        return {};
      }

      // Process phase transition statistics
      const stats: {[key: string]: number} = {};
      
      data.forEach((record: any) => {
        const phaseHistory = record.phase_history || [];
        phaseHistory.forEach((transition: PhaseHistory) => {
          const key = `${transition.from_phase}_to_${transition.to_phase}`;
          stats[key] = (stats[key] || 0) + 1;
        });
        
        // Count current phases
        const currentPhaseKey = `current_phase_${record.current_phase}`;
        stats[currentPhaseKey] = (stats[currentPhaseKey] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Exception in getPhaseTransitionStats:', error);
      return {};
    }
  }

  /**
   * Delete conversation tracking record
   * Use with caution - this will remove all tracking data
   * 
   * @param conversationId - UUID of the conversation
   * @returns Promise with success boolean
   */
  static async deleteConversationTracking(
    conversationId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_tracking')
        .delete()
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error deleting conversation tracking:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in deleteConversationTracking:', error);
      return false;
    }
  }
}

export default ConversationStateManager;