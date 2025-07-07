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

// Default configuration
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minScore: 0.7,
  keyPhraseWeight: 0.8,
  strictMode: false,
  regenerateThreshold: 0.5,
  maxRegenerationAttempts: 2,
};

// Synonym mapping for flexible matching
export const SYNONYM_MAP: Record<string, string[]> = {
  'problema': ['dificultad', 'inconveniente', 'reto', 'desafío', 'obstáculo'],
  'objetivo': ['meta', 'propósito', 'finalidad', 'intención'],
  'negocio': ['empresa', 'emprendimiento', 'proyecto', 'compañía'],
  'youtube': ['canal', 'contenido', 'videos', 'plataforma'],
  'ayudar': ['asistir', 'apoyar', 'colaborar', 'contribuir'],
  'entender': ['comprender', 'entiendo', 'comprendo'],
};

// Phase-specific validation rules
export const PHASE_VALIDATION_RULES: Record<number, {
  requiredElements: string[];
  forbiddenElements: string[];
  maxLength: number;
}> = {
  1: {
    requiredElements: ['pregunta', 'youtube', 'negocio'],
    forbiddenElements: ['precio', '5000', 'llamada', 'agendar'],
    maxLength: 150,
  },
  2: {
    requiredElements: ['problema', 'frustración', 'dificultad'],
    forbiddenElements: ['precio', '5000'],
    maxLength: 200,
  },
  3: {
    requiredElements: ['objetivo', 'lograr', 'conseguir'],
    forbiddenElements: ['precio', '5000'],
    maxLength: 200,
  },
  4: {
    requiredElements: ['obstáculo', 'impide', 'barrera'],
    forbiddenElements: ['precio'],
    maxLength: 250,
  },
  5: {
    requiredElements: ['llamada', 'agendar', 'minutos'],
    forbiddenElements: [],
    maxLength: 300,
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
    const isQuestion = trimmed.includes('?') || 
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
      
      // Determine weight based on content
      let weight = 0.5; // default weight
      
      if (isQuestion) weight = 0.8;
      else if (phrase.includes('youtube') || phrase.includes('negocio')) weight = 0.7;
      else if (phrase.includes('problema') || phrase.includes('objetivo')) weight = 0.7;
      else if (phrase.includes('ayud') || phrase.includes('apoy')) weight = 0.6;
      
      // Determine if required based on template type
      const required = template.template_type === 'greeting' ||
                      template.template_type === 'question' ||
                      isQuestion;
      
      keyPhrases.push({
        phrase: phrase,
        required: required,
        weight: weight
      });
    }
    
    // Also extract shorter important phrases (2-3 words)
    if (words.length > 3) {
      for (let i = 0; i < words.length - 2; i++) {
        const shortPhrase = words.slice(i, i + 3).join(' ');
        
        // Check if it contains important keywords
        if (shortPhrase.match(/(youtube|canal|video|negocio|empresa|problema|dificultad|objetivo|meta)/)) {
          keyPhrases.push({
            phrase: shortPhrase,
            required: false,
            weight: 0.4
          });
        }
      }
    }
  });
  
  // Remove duplicates and sort by weight
  const uniquePhrases = Array.from(
    new Map(keyPhrases.map(kp => [kp.phrase, kp])).values()
  );
  
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
        required: existing ? (existing.required || phrase.required) : phrase.required
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
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
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
  return 1 - (distance / maxLen);
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
  keyPhrases: KeyPhrase[]
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
        matchedText: keyPhrase.phrase
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
        matchedText: 'synonym match'
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
    
    // Consider it a match if similarity is above threshold
    if (bestMatch.confidence > 0.7) {
      matches.push({
        phrase: keyPhrase.phrase,
        matchConfidence: bestMatch.confidence,
        matchedText: bestMatch.text
      });
      return;
    }
    
    // 4. Partial match - check if most important words are present
    const matchedWords = importantWords.filter(word => 
      normalizedResponse.includes(word) || containsSynonym(response, word)
    );
    
    const partialMatchRatio = matchedWords.length / importantWords.length;
    if (partialMatchRatio >= 0.6) {
      matches.push({
        phrase: keyPhrase.phrase,
        matchConfidence: 0.5 + (partialMatchRatio * 0.3),
        matchedText: 'partial match'
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
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
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
  
  // Apply penalties
  if (config.strictMode && requiredMissing > 0) {
    // In strict mode, missing required phrases severely penalize the score
    finalScore *= Math.pow(0.5, requiredMissing);
  } else if (requiredMissing > 0) {
    // Normal mode: moderate penalty for missing required phrases
    finalScore *= Math.pow(0.8, requiredMissing);
  }
  
  // Length penalty - responses should be similar length to templates
  const lengthRatio = responseLength / templateLength;
  if (lengthRatio < 0.5) {
    // Too short
    finalScore *= 0.8;
  } else if (lengthRatio > 2.0) {
    // Too long
    finalScore *= 0.9;
  }
  
  // Ensure score is between 0 and 1
  finalScore = Math.max(0, Math.min(1, finalScore));
  
  // Generate suggestions
  const suggestions: string[] = [];
  
  if (finalScore < config.minScore) {
    if (requiredMissing > 0) {
      suggestions.push(`Incluye elementos requeridos: ${missingPhrases.filter(p => 
        keyPhrases.find(kp => kp.phrase === p && kp.required)
      ).join(', ')}`);
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
      templateLength
    }
  };
}

// Main validation function
export async function validateResponseAlignment(
  response: string,
  currentPhase: number,
  leadType?: string,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
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
          templateLength: 0
        }
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
          templateLength: 0
        }
      };
    }
    
    // 3. Calculate average template length
    const avgTemplateLength = templates.reduce((sum, t) => sum + t.content.length, 0) / templates.length;
    
    // 4. Find matches in response
    const matches = findPhraseMatches(response, keyPhrases);
    
    // 5. Calculate alignment score
    const validationResult = calculateAlignmentScore(
      keyPhrases,
      matches,
      response.length,
      avgTemplateLength,
      config
    );
    
    // 6. Add phase-specific validation
    const phaseRules = PHASE_VALIDATION_RULES[currentPhase];
    if (phaseRules) {
      // Check for forbidden elements
      const forbiddenFound = phaseRules.forbiddenElements.filter(element => 
        response.toLowerCase().includes(element.toLowerCase())
      );
      
      if (forbiddenFound.length > 0) {
        validationResult.score *= 0.7; // Penalty for forbidden elements
        validationResult.suggestions.push(
          `Evita mencionar: ${forbiddenFound.join(', ')} en esta fase.`
        );
      }
      
      // Check required elements
      const requiredMissing = phaseRules.requiredElements.filter(element => 
        !response.toLowerCase().includes(element.toLowerCase())
      );
      
      if (requiredMissing.length > 0) {
        validationResult.score *= Math.pow(0.9, requiredMissing.length);
        validationResult.suggestions.push(
          `Asegúrate de incluir conceptos sobre: ${requiredMissing.join(', ')}`
        );
      }
      
      // Check length compliance
      if (response.length > phaseRules.maxLength) {
        validationResult.suggestions.push(
          `Respuesta muy larga para fase ${currentPhase}. Máximo recomendado: ${phaseRules.maxLength} caracteres.`
        );
      }
    }
    
    // 7. Generate improvement suggestions if score is low
    if (validationResult.score < config.regenerateThreshold) {
      validationResult.suggestions.unshift(
        '⚠️ La respuesta necesita mejoras significativas para alinearse con el script.'
      );
      
      // Add specific template example
      const bestTemplate = templates.find(t => t.priority === Math.max(...templates.map(t => t.priority || 0)));
      if (bestTemplate && bestTemplate.example_usage) {
        validationResult.suggestions.push(
          `Ejemplo recomendado: "${bestTemplate.example_usage}"`
        );
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
        templateLength: 0
      }
    };
  }
}

// Export a singleton validator instance
export const responseValidator = {
  validate: validateResponseAlignment,
  extractKeyPhrases: extractKeyPhrasesFromTemplate,
  findMatches: findPhraseMatches,
  calculateScore: calculateAlignmentScore
};