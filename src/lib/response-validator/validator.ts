// Main validation functionality for response validation

import { promptManager } from '../prompt-manager';
import type { ResponseValidationResult, ValidationConfig } from './types';
import { DEFAULT_VALIDATION_CONFIG, PHASE_VALIDATION_RULES } from './constants';
import { extractKeyPhrasesFromTemplates } from './key-phrase-extractor';
import { findPhraseMatches } from './phrase-matcher';
import { calculateAlignmentScore } from './alignment-scorer';

// Main validation function
export async function validateResponseAlignment(
  response: string,
  currentPhase: number,
  leadType?: string,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG,
): Promise<ResponseValidationResult> {
  try {
    // 1. Get templates for current phase
    const templates = await promptManager.getScriptTemplates(currentPhase, leadType);

    if (!templates || templates.length === 0) {
      // No templates found for validation
      return {
        score: 1.0, // Default to pass if no templates
        isValid: true,
        matchedKeyPhrases: [],
        missingKeyPhrases: [],
        suggestions: ['No hay templates disponibles para validar esta fase.'],
        metadata: {
          totalPhrases: 0,
          matchedCount: 0,
          requiredMissing: 0,
          responseLength: response.length,
          templateLength: 0,
        },
      };
    }

    // 2. Extract key phrases from templates
    const keyPhrases = extractKeyPhrasesFromTemplates(templates);

    if (keyPhrases.length === 0) {
      // No key phrases extracted
      return {
        score: 1.0,
        isValid: true,
        matchedKeyPhrases: [],
        missingKeyPhrases: [],
        suggestions: ['No se pudieron extraer frases clave de los templates.'],
        metadata: {
          totalPhrases: 0,
          matchedCount: 0,
          requiredMissing: 0,
          responseLength: response.length,
          templateLength: 0,
        },
      };
    }

    // 3. Calculate average template length
    const avgTemplateLength =
      templates.reduce((sum, t) => sum + t.content.length, 0) / templates.length;

    // 4. Find matches in response
    const matches = findPhraseMatches(response, keyPhrases);

    // 5. Calculate alignment score
    const validationResult = calculateAlignmentScore(
      keyPhrases,
      matches,
      response.length,
      avgTemplateLength,
      config,
    );

    // 6. Add phase-specific validation
    const phaseRules = PHASE_VALIDATION_RULES[currentPhase];
    if (phaseRules) {
      // Check for forbidden elements
      const forbiddenFound = phaseRules.forbiddenElements.filter(element =>
        response.toLowerCase().includes(element.toLowerCase()),
      );

      if (forbiddenFound.length > 0) {
        validationResult.score *= 0.85; // Penalización más suave
        validationResult.suggestions.push(
          `Intenta no mencionar directamente: ${forbiddenFound.join(', ')} en esta fase.`,
        );
      }

      // Ya no verificamos elementos requeridos para permitir más naturalidad
      // Las respuestas naturales no siempre mencionan palabras clave específicas
      // Mantenemos la lógica comentada por si se necesita en el futuro
      /*
      const requiredMissing = phaseRules.requiredElements.filter(
        element => !response.toLowerCase().includes(element.toLowerCase()),
      );
      */

      // Check length compliance
      if (response.length > phaseRules.maxLength) {
        validationResult.suggestions.push(
          `Respuesta muy larga para fase ${currentPhase}. Máximo recomendado: ${phaseRules.maxLength} caracteres.`,
        );
      }
    }

    // 7. Generate improvement suggestions if score is low
    if (validationResult.score < config.regenerateThreshold) {
      validationResult.suggestions.unshift(
        '⚠️ La respuesta necesita mejoras significativas para alinearse con el script.',
      );

      // Add specific template example
      const bestTemplate = templates.find(
        t => t.priority === Math.max(...templates.map(t => t.priority || 0)),
      );
      if (bestTemplate && bestTemplate.example_usage) {
        validationResult.suggestions.push(`Ejemplo recomendado: "${bestTemplate.example_usage}"`);
      }
    }

    return validationResult;
  } catch (error) {
    console.error('Error validating response alignment:', error);

    // Return neutral result on error
    return {
      score: 0.5,
      isValid: false,
      matchedKeyPhrases: [],
      missingKeyPhrases: [],
      suggestions: ['Error al validar la respuesta. Procediendo con precaución.'],
      metadata: {
        totalPhrases: 0,
        matchedCount: 0,
        requiredMissing: 0,
        responseLength: response.length,
        templateLength: 0,
      },
    };
  }
}