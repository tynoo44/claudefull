// Alignment scoring functionality for response validation

import type { KeyPhrase, ResponseValidationResult, ValidationConfig } from './types';
import { DEFAULT_VALIDATION_CONFIG } from './constants';

// Calculate alignment score based on matches
export function calculateAlignmentScore(
  keyPhrases: KeyPhrase[],
  matches: Array<{ phrase: string; matchConfidence: number }>,
  responseLength: number,
  templateLength: number,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
): ResponseValidationResult {
  // Initialize tracking variables
  let totalScore = 0;
  let weightSum = 0;
  const matchedPhrases: Array<{ phrase: string; matchConfidence: number }> = [];
  const missingPhrases: string[] = [];
  let requiredMissing = 0;

  // Process each key phrase
  keyPhrases.forEach(keyPhrase => {
    const match = matches.find(m => m.phrase === keyPhrase.phrase);

    if (match) {
      // Calculate weighted score for this match
      const weightedScore = match.matchConfidence * keyPhrase.weight;
      totalScore += weightedScore;
      weightSum += keyPhrase.weight;
      matchedPhrases.push(match);
    } else {
      // Track missing phrases
      missingPhrases.push(keyPhrase.phrase);
      weightSum += keyPhrase.weight;

      if (keyPhrase.required) {
        requiredMissing++;
      }
    }
  });

  // Calculate base score
  let finalScore = weightSum > 0 ? totalScore / weightSum : 0;

  // Apply penalties - Mucho más suave para permitir naturalidad
  if (config.strictMode && requiredMissing > 0) {
    // In strict mode, missing required phrases moderately penalize the score
    finalScore *= Math.pow(0.7, requiredMissing); // Menos severo
  } else if (requiredMissing > 0) {
    // Normal mode: light penalty for missing required phrases
    finalScore *= Math.pow(0.9, requiredMissing); // Muy suave
  }

  // Length penalty - Más flexible con la longitud
  const lengthRatio = responseLength / templateLength;
  if (lengthRatio < 0.3) {
    // Response too short - penalidad suave
    finalScore *= 0.85 + lengthRatio * 0.5;
  } else if (lengthRatio > 2.5) {
    // Response too long - penalidad muy suave
    finalScore *= 0.95;
  }

  // Determine validity - Umbral más bajo para más flexibilidad
  const isValid = finalScore >= config.minScore;

  // Generate suggestions
  const suggestions: string[] = [];

  if (requiredMissing > 0 && config.strictMode) {
    suggestions.push(`Te faltan ${requiredMissing} elementos importantes del script.`);
  }

  if (missingPhrases.length > keyPhrases.length * 0.7) {
    // Solo sugerir si falta mucho
    suggestions.push('La respuesta se desvía bastante del script base. Intenta ser más natural.');
  }

  if (lengthRatio < 0.3) {
    suggestions.push('La respuesta es muy corta. Desarrolla un poco más la conversación.');
  } else if (lengthRatio > 2.5) {
    suggestions.push('La respuesta es muy larga. Intenta ser más conciso.');
  }

  // If score is low, suggest focusing on key elements
  if (finalScore < config.regenerateThreshold) {
    const topMissing = missingPhrases
      .slice(0, 3)
      .map(p => `"${p}"`)
      .join(', ');
    if (topMissing) {
      suggestions.push(`Considera incluir conceptos como: ${topMissing} de forma natural.`);
    }
  }

  return {
    score: finalScore,
    isValid: isValid,
    matchedKeyPhrases: matchedPhrases,
    missingKeyPhrases: missingPhrases,
    suggestions: suggestions,
    metadata: {
      totalPhrases: keyPhrases.length,
      matchedCount: matchedPhrases.length,
      requiredMissing: requiredMissing,
      responseLength: responseLength,
      templateLength: Math.round(templateLength),
    },
  };
}
