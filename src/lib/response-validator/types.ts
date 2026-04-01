// Response validation types and interfaces

export interface KeyPhrase {
  phrase: string;
  required: boolean;
  weight: number; // 0.0 to 1.0
}

export interface ResponseValidationResult {
  score: number; // 0.0 to 1.0
  isValid: boolean; // Whether the response meets minimum requirements
  matchedKeyPhrases: Array<{
    phrase: string;
    matchConfidence: number;
  }>;
  missingKeyPhrases: string[];
  suggestions: string[];
  metadata: {
    totalPhrases: number;
    matchedCount: number;
    requiredMissing: number;
    responseLength: number;
    templateLength: number;
  };
}

export interface ValidationConfig {
  minScore: number; // Minimum acceptable score
  keyPhraseWeight: number; // Weight for key phrase matching
  strictMode: boolean; // If true, all required phrases must match
  regenerateThreshold: number; // Score below which to regenerate
  maxRegenerationAttempts: number;
}

export interface ValidationContext {
  currentPhase: number;
  leadType?: string;
  conversationHistory?: string[];
}
