// Shared types for conversation analysis modules

export interface AnalysisResult {
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

export interface PhaseDetail {
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  information_gathered: string[];
  next_steps: string[];
}

export interface SentimentPoint {
  timestamp: Date;
  score: number;
  emotion: string;
}

export interface KeyMoment {
  message_index: number;
  type: 'positive_shift' | 'negative_shift' | 'objection' | 'buying_signal' | 'pain_point';
  description: string;
}

export interface ConversationMessage {
  id?: string;
  text: string;
  sender_type: string;
  created_at?: string;
}

export interface ConversationData {
  id: string;
  lead_id: string;
  current_phase: number;
  leads?: any;
}

export interface AnalysisQueueConfig {
  messageDelay: number;
  maxConcurrentAnalyses: number;
  checkInterval: number;
}