// Types and interfaces for AI module

export interface PhaseInfo {
  business_type?: string;
  business_age?: string;
  pain_identified?: boolean;
  goals_defined?: boolean;
  obstacles_identified?: boolean;
  offer_discussed?: boolean;
  [key: string]: unknown;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateResponseOptions {
  messages: AIMessage[];
  model: AIModel;
  conversationContext?: string;
  currentPhase?: number;
  leadType?: string;
  conversationId?: string;
  leadId?: string;
  enableTracking?: boolean;
}

// Available models - GPT
export const AI_MODELS = {
  'gpt-5.4': 'GPT 5.4',
  'gpt-4o-mini': 'GPT-4o Mini',
} as const;

// Backward compatibility
export const GEMINI_MODELS = AI_MODELS;

export const DEFAULT_MODEL: AIModel = 'gpt-5.4';

export type AIModel = keyof typeof AI_MODELS;
export type GeminiModel = AIModel;
