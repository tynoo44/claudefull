// Response validation system for AI-generated messages
// Ensures alignment with Quantum script templates

export * from './types';
export * from './constants';
export * from './utils';
export * from './key-phrase-extractor';
export * from './phrase-matcher';
export * from './alignment-scorer';
export * from './validator';

// Import for convenience
import { validateResponseAlignment } from './validator';
import { extractKeyPhrasesFromTemplate } from './key-phrase-extractor';
import { findPhraseMatches } from './phrase-matcher';
import { calculateAlignmentScore } from './alignment-scorer';

// Export a singleton validator instance
export const responseValidator = {
  validate: validateResponseAlignment,
  extractKeyPhrases: extractKeyPhrasesFromTemplate,
  findMatches: findPhraseMatches,
  calculateScore: calculateAlignmentScore,
};