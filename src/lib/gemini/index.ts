// Legacy Gemini AI module - DEPRECATED
// Use ../ai-service.ts instead for secure API communication

export * from './types';
export * from './phase-extractor';
export * from './prompt-builder';

// Re-export from secure ai-service for backward compatibility
export {
  generateAIResponse,
  generateQuickActions,
  GEMINI_MODELS,
  type GeminiModel,
} from '../ai-service';