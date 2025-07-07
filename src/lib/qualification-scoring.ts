import { ConversationState, PhaseInfo } from './conversation-state-manager';

/**
 * Qualification Scoring System
 * 
 * Client-side utilities for understanding and working with qualification scores.
 * The actual calculation is performed server-side in Supabase RPC function.
 */

export interface QualificationScoreBreakdown {
  total_score: number;
  base_score: number;
  engagement_score: number;
  info_score: number;
  phase: number;
  total_messages: number;
  info_fields_count: number;
}

export interface ScoreWeights {
  phase_weight: number;      // 40%
  engagement_weight: number; // 30%
  info_weight: number;       // 30%
}

/**
 * Default scoring weights used by the system
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  phase_weight: 0.40,
  engagement_weight: 0.30,
  info_weight: 0.30
};

/**
 * Phase base scores mapping
 */
export const PHASE_BASE_SCORES: Record<number, number> = {
  1: 0.10, // Situación Actual
  2: 0.25, // Dolor
  3: 0.40, // Situación Deseada
  4: 0.60, // Obstáculo
  5: 0.80, // Oferta
};

/**
 * Calculate qualification score breakdown (client-side preview)
 * This mirrors the server-side calculation for UI purposes
 * 
 * @param currentPhase - Current sales phase (1-5)
 * @param conversationState - State of the conversation
 * @param phaseInfo - Information collected per phase
 * @returns Detailed score breakdown
 */
export function calculateScoreBreakdown(
  currentPhase: number,
  conversationState: ConversationState,
  phaseInfo: PhaseInfo
): QualificationScoreBreakdown {
  // Base score by phase (40% weight)
  const base_score = PHASE_BASE_SCORES[currentPhase] || 0.05;
  
  // Engagement score based on message count (30% weight)
  const total_messages = conversationState.total_messages || 0;
  const engagement_score = Math.min(
    (total_messages / 20.0) * DEFAULT_SCORE_WEIGHTS.engagement_weight,
    DEFAULT_SCORE_WEIGHTS.engagement_weight
  );
  
  // Information completeness score (30% weight)
  const info_fields_count = Object.keys(phaseInfo).length;
  const info_score = info_fields_count > 0 
    ? Math.min(
        (info_fields_count / 10.0) * DEFAULT_SCORE_WEIGHTS.info_weight,
        DEFAULT_SCORE_WEIGHTS.info_weight
      )
    : 0.0;
  
  // Calculate total score
  const total_score = Math.min(base_score + engagement_score + info_score, 1.0);
  
  return {
    total_score: Math.round(total_score * 100) / 100, // Round to 2 decimals
    base_score: Math.round(base_score * 100) / 100,
    engagement_score: Math.round(engagement_score * 100) / 100,
    info_score: Math.round(info_score * 100) / 100,
    phase: currentPhase,
    total_messages,
    info_fields_count
  };
}

/**
 * Get qualification level description based on score
 * 
 * @param score - Qualification score (0.0 to 1.0)
 * @returns Human-readable qualification level
 */
export function getQualificationLevel(score: number): {
  level: string;
  description: string;
  color: string;
} {
  if (score >= 0.8) {
    return {
      level: 'High',
      description: 'Ready for appointment setting',
      color: 'green'
    };
  } else if (score >= 0.6) {
    return {
      level: 'Medium-High',
      description: 'Close to appointment ready',
      color: 'blue'
    };
  } else if (score >= 0.4) {
    return {
      level: 'Medium',
      description: 'Progressing well through funnel',
      color: 'yellow'
    };
  } else if (score >= 0.2) {
    return {
      level: 'Low-Medium',
      description: 'Early stage, needs nurturing',
      color: 'orange'
    };
  } else {
    return {
      level: 'Low',
      description: 'Just started or disengaged',
      color: 'red'
    };
  }
}

/**
 * Get phase description and requirements
 * 
 * @param phase - Sales phase number (1-5)
 * @returns Phase information
 */
export function getPhaseInfo(phase: number): {
  name: string;
  description: string;
  requirements: string[];
  next_phase?: string;
} {
  const phases = {
    1: {
      name: 'Situación Actual',
      description: 'Understanding the lead\'s current situation',
      requirements: [
        'Establish rapport',
        'Understand current business state',
        'Identify decision makers'
      ],
      next_phase: 'Dolor'
    },
    2: {
      name: 'Dolor',
      description: 'Identifying pain points and challenges',
      requirements: [
        'Uncover specific pain points',
        'Quantify impact of problems',
        'Establish urgency'
      ],
      next_phase: 'Situación Deseada'
    },
    3: {
      name: 'Situación Deseada',
      description: 'Understanding desired future state',
      requirements: [
        'Define ideal outcome',
        'Establish success metrics',
        'Confirm value proposition fit'
      ],
      next_phase: 'Obstáculo'
    },
    4: {
      name: 'Obstáculo',
      description: 'Identifying obstacles to success',
      requirements: [
        'Uncover potential objections',
        'Address implementation concerns',
        'Build confidence in solution'
      ],
      next_phase: 'Oferta'
    },
    5: {
      name: 'Oferta',
      description: 'Presenting solution and closing',
      requirements: [
        'Present tailored solution',
        'Handle final objections',
        'Schedule appointment'
      ]
    }
  };
  
  return phases[phase as keyof typeof phases] || {
    name: 'Unknown',
    description: 'Unknown phase',
    requirements: []
  };
}

/**
 * Calculate the minimum score needed to advance to next phase
 * 
 * @param currentPhase - Current phase number
 * @returns Minimum score threshold
 */
export function getMinScoreForNextPhase(currentPhase: number): number {
  // Base thresholds for phase advancement
  const thresholds = {
    1: 0.15, // From Situación Actual to Dolor
    2: 0.30, // From Dolor to Situación Deseada  
    3: 0.45, // From Situación Deseada to Obstáculo
    4: 0.65, // From Obstáculo to Oferta
    5: 0.80  // For appointment setting
  };
  
  return thresholds[currentPhase as keyof typeof thresholds] || 0.20;
}

/**
 * Suggest improvements to increase qualification score
 * 
 * @param breakdown - Current score breakdown
 * @returns Array of improvement suggestions
 */
export function suggestScoreImprovements(
  breakdown: QualificationScoreBreakdown
): string[] {
  const suggestions: string[] = [];
  
  // Check engagement
  if (breakdown.engagement_score < 0.20) {
    suggestions.push('Increase conversation engagement - aim for more back-and-forth dialogue');
  }
  
  // Check information collection
  if (breakdown.info_score < 0.20) {
    suggestions.push('Collect more detailed information about the lead\'s situation');
  }
  
  // Phase-specific suggestions
  const phaseInfo = getPhaseInfo(breakdown.phase);
  if (breakdown.base_score < PHASE_BASE_SCORES[breakdown.phase]) {
    suggestions.push(`Focus on completing ${phaseInfo.name} phase requirements`);
  }
  
  // Message count suggestions
  if (breakdown.total_messages < 10) {
    suggestions.push('Continue building rapport through meaningful conversation');
  }
  
  // Information fields suggestions
  if (breakdown.info_fields_count < 3) {
    suggestions.push('Ask more qualifying questions to better understand the lead');
  }
  
  return suggestions;
}

export default {
  calculateScoreBreakdown,
  getQualificationLevel,
  getPhaseInfo,
  getMinScoreForNextPhase,
  suggestScoreImprovements,
  DEFAULT_SCORE_WEIGHTS,
  PHASE_BASE_SCORES
};