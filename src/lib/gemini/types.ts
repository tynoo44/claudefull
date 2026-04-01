// Types and interfaces for Gemini AI module

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
  model: GeminiModel;
  conversationContext?: string;
  currentPhase?: number;
  leadType?: string;
  conversationId?: string;
  leadId?: string;
  enableTracking?: boolean;
}

// Available models - Pro is now default
export const GEMINI_MODELS = {
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
} as const;

// Default model configuration
export const DEFAULT_MODEL: GeminiModel = 'gemini-2.5-pro';

export type GeminiModel = keyof typeof GEMINI_MODELS;
