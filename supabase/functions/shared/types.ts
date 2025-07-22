// Shared types for Edge Functions
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

export interface GeminiConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface EdgeFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}