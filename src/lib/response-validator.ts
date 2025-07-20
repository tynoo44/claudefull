// Response validation system for AI-generated messages
// Ensures alignment with Quantum script templates

import { ScriptTemplate, promptManager } from './prompt-manager';

export interface KeyPhrase {
  phrase: string;
  required: boolean;
  weight: number; // 0.0 to 1.0
}

export interface ResponseValidationResult {
  score: number; // 0.0 to 1.0
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

// Default configuration - Ajustado para permitir respuestas más naturales
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minScore: 0.5, // Reducido para permitir más flexibilidad
  keyPhraseWeight: 0.6, // Menos énfasis en coincidencias exactas
  strictMode: false,
  regenerateThreshold: 0.3, // Solo regenerar si es muy malo
  maxRegenerationAttempts: 1, // Menos intentos para evitar sobre-optimización
};

// Synonym mapping for flexible matching - Expandido con lenguaje informal
export const SYNONYM_MAP: Record<string, string[]> = {
  problema: [
    'dificultad',
    'inconveniente',
    'reto',
    'desafío',
    'obstáculo',
    'lio',
    'rollo',
    'tema',
    'movida',
  ],
  objetivo: [
    'meta',
    'propósito',
    'finalidad',
    'intención',
    'lo que quieres',
    'lo que buscas',
    'tu plan',
  ],
  negocio: ['empresa', 'emprendimiento', 'proyecto', 'compañía', 'curro', 'tu rollo', 'lo tuyo'],
  youtube: ['canal', 'contenido', 'videos', 'plataforma', 'yt', 'el tubo'],
  ayudar: ['asistir', 'apoyar', 'colaborar', 'contribuir', 'echar una mano', 'darle', 'meter caña'],
  entender: ['comprender', 'entiendo', 'comprendo', 'pillo', 'capto', 'te sigo', 'claro'],
  hola: ['hey', 'que tal', 'buenas', 'que pasa', 'como va', 'ey'],
  gracias: ['grax', 'thanks', 'genial', 'top', 'guay', 'de puta madre'],
};

// Phase-specific validation rules - Más flexible para lenguaje natural
export const PHASE_VALIDATION_RULES: Record<
  number,
  {
    requiredElements: string[];
    forbiddenElements: string[];
    maxLength: number;
  }
> = {
  1: {
    requiredElements: [], // No forzar palabras específicas
    forbiddenElements: ['precio', '5000', '€', 'euros', 'coste'], // Solo evitar hablar de dinero
    maxLength: 250, // Más espacio para conversación natural
  },
  2: {
    requiredElements: [], // Permitir flexibilidad en cómo expresar dolor
    forbiddenElements: ['precio', '5000', '€', 'euros'],
    maxLength: 300,
  },
  3: {
    requiredElements: [], // Objetivos pueden expresarse de muchas formas
    forbiddenElements: ['precio', '5000', '€', 'euros'],
    maxLength: 300,
  },
  4: {
    requiredElements: [], // Obstáculos son contextuales
    forbiddenElements: ['precio específico', '5000'],
    maxLength: 350,
  },
  5: {
    requiredElements: [], // La oferta puede ser sutil
    forbiddenElements: [],
    maxLength: 400,
  },
};

// Extract key phrases from a script template
export function extractKeyPhrasesFromTemplate(template: ScriptTemplate): KeyPhrase[] {
  const content = template.content.toLowerCase();
  const keyPhrases: KeyPhrase[] = [];

  // Remove variable placeholders
  const cleanContent = content.replace(/\[[A-Z_]+\]/g, '');

  // Split into sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();

    // Questions have higher weight
    const isQuestion =
      trimmed.includes('?') ||
      trimmed.includes('cuál') ||
      trimmed.includes('qué') ||
      trimmed.includes('cómo') ||
      trimmed.includes('cuándo') ||
      trimmed.includes('por qué');

    // Key phrases are typically 3-8 words
    const words = trimmed.split(/\s+/);

    if (words.length >= 3 && words.length <= 8) {
      // Extract meaningful phrases
      const phrase = words.join(' ');

      // Determine weight based on content - Reducido para más flexibilidad
      let weight = 0.3; // default weight más bajo

      if (isQuestion)
        weight = 0.5; // Las preguntas son importantes pero no críticas
      else if (phrase.includes('youtube') || phrase.includes('negocio')) weight = 0.4;
      else if (phrase.includes('problema') || phrase.includes('objetivo')) weight = 0.4;
      else if (phrase.includes('ayud') || phrase.includes('apoy')) weight = 0.3;

      // Determine if required based on template type
      const required =
        template.template_type === 'greeting' ||
        template.template_type === 'question' ||
        isQuestion;

      keyPhrases.push({
        phrase: phrase,
        required: required,
        weight: weight,
      });
    }

    // Also extract shorter important phrases (2-3 words)
    if (words.length > 3) {
      for (let i = 0; i < words.length - 2; i++) {
        const shortPhrase = words.slice(i, i + 3).join(' ');

        // Check if it contains important keywords
        if (
          shortPhrase.match(
            /(youtube|canal|video|negocio|empresa|problema|dificultad|objetivo|meta)/,
          )
        ) {
          keyPhrases.push({
            phrase: shortPhrase,
            required: false,
            weight: 0.4,
          });
        }
      }
    }
  });

  // Remove duplicates and sort by weight
  const uniquePhrases = Array.from(new Map(keyPhrases.map(kp => [kp.phrase, kp])).values());

  return uniquePhrases.sort((a, b) => b.weight - a.weight);
}

// Extract key phrases from multiple templates
export function extractKeyPhrasesFromTemplates(templates: ScriptTemplate[]): KeyPhrase[] {
  const allPhrases: KeyPhrase[] = [];

  templates.forEach(template => {
    const phrases = extractKeyPhrasesFromTemplate(template);
    allPhrases.push(...phrases);
  });

  // Merge duplicates, keeping highest weight and required status
  const phraseMap = new Map<string, KeyPhrase>();

  allPhrases.forEach(phrase => {
    const existing = phraseMap.get(phrase.phrase);
    if (!existing || phrase.weight > existing.weight) {
      phraseMap.set(phrase.phrase, {
        ...phrase,
        required: existing ? existing.required || phrase.required : phrase.required,
      });
    }
  });

  return Array.from(phraseMap.values()).sort((a, b) => b.weight - a.weight);
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1, // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Calculate similarity score between two strings (0.0 to 1.0)
function stringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

// Check if a phrase contains synonyms
function containsSynonym(phrase: string, targetWord: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  const normalizedTarget = normalizeText(targetWord);

  // Direct match
  if (normalizedPhrase.includes(normalizedTarget)) return true;

  // Check synonyms
  const synonyms = SYNONYM_MAP[targetWord] || [];
  for (const synonym of synonyms) {
    if (normalizedPhrase.includes(normalizeText(synonym))) return true;
  }

  // Check reverse synonyms (if target is a synonym of another word)
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (values.includes(targetWord) && normalizedPhrase.includes(normalizeText(key))) {
      return true;
    }
  }

  return false;
}

// Find phrase matches in response with flexible matching
export function findPhraseMatches(
  response: string,
  keyPhrases: KeyPhrase[],
): Array<{ phrase: string; matchConfidence: number; matchedText?: string }> {
  const normalizedResponse = normalizeText(response);
  const responseWords = normalizedResponse.split(' ');
  const matches: Array<{ phrase: string; matchConfidence: number; matchedText?: string }> = [];

  keyPhrases.forEach(keyPhrase => {
    const normalizedPhrase = normalizeText(keyPhrase.phrase);
    const phraseWords = normalizedPhrase.split(' ');

    // 1. Exact match
    if (normalizedResponse.includes(normalizedPhrase)) {
      matches.push({
        phrase: keyPhrase.phrase,
        matchConfidence: 1.0,
        matchedText: keyPhrase.phrase,
      });
      return;
    }

    // 2. Check for synonym matches
    let synonymMatch = false;
    const importantWords = phraseWords.filter(w => w.length > 3);

    for (const word of importantWords) {
      if (containsSynonym(response, word)) {
        synonymMatch = true;
        break;
      }
    }

    if (synonymMatch) {
      matches.push({
        phrase: keyPhrase.phrase,
        matchConfidence: 0.8,
        matchedText: 'synonym match',
      });
      return;
    }

    // 3. Sliding window similarity check
    const windowSize = phraseWords.length;
    let bestMatch = { confidence: 0, text: '' };

    for (let i = 0; i <= responseWords.length - windowSize; i++) {
      const window = responseWords.slice(i, i + windowSize).join(' ');
      const similarity = stringSimilarity(normalizedPhrase, window);

      if (similarity > bestMatch.confidence) {
        bestMatch = { confidence: similarity, text: window };
      }
    }

    // Consider it a match if similarity is above threshold - Más permisivo
    if (bestMatch.confidence > 0.5) {
      // Reducido de 0.7 a 0.5
      matches.push({
        phrase: keyPhrase.phrase,
        matchConfidence: bestMatch.confidence,
        matchedText: bestMatch.text,
      });
      return;
    }

    // 4. Partial match - check if most important words are present
    const matchedWords = importantWords.filter(
      word => normalizedResponse.includes(word) || containsSynonym(response, word),
    );

    const partialMatchRatio = matchedWords.length / importantWords.length;
    if (partialMatchRatio >= 0.4) {
      // Más permisivo con coincidencias parciales
      matches.push({
        phrase: keyPhrase.phrase,
        matchConfidence: 0.4 + partialMatchRatio * 0.3, // Score base más bajo
        matchedText: 'partial match',
      });
    }
  });

  return matches;
}

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
    // Solo penalizar si es MUY corto
    // Too short
    finalScore *= 0.9; // Penalización suave
  } else if (lengthRatio > 3.0) {
    // Permitir respuestas más largas
    // Too long
    finalScore *= 0.95; // Penalización mínima
  }

  // Ensure score is between 0 and 1
  finalScore = Math.max(0, Math.min(1, finalScore));

  // Generate suggestions
  const suggestions: string[] = [];

  if (finalScore < config.minScore) {
    if (requiredMissing > 0) {
      suggestions.push(
        `Incluye elementos requeridos: ${missingPhrases
          .filter(p => keyPhrases.find(kp => kp.phrase === p && kp.required))
          .join(', ')}`,
      );
    }

    if (lengthRatio < 0.5) {
      suggestions.push('La respuesta es muy corta. Añade más detalles relevantes.');
    } else if (lengthRatio > 2.0) {
      suggestions.push('La respuesta es muy larga. Sé más conciso.');
    }

    if (missingPhrases.length > keyPhrases.length * 0.5) {
      suggestions.push('La respuesta no sigue el script. Revisa los templates de la fase actual.');
    }
  }

  return {
    score: finalScore,
    matchedKeyPhrases: matchedPhrases,
    missingKeyPhrases: missingPhrases,
    suggestions,
    metadata: {
      totalPhrases: keyPhrases.length,
      matchedCount: matchedPhrases.length,
      requiredMissing,
      responseLength,
      templateLength,
    },
  };
}

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

// Export a singleton validator instance
export const responseValidator = {
  validate: validateResponseAlignment,
  extractKeyPhrases: extractKeyPhrasesFromTemplate,
  findMatches: findPhraseMatches,
  calculateScore: calculateAlignmentScore,
};
