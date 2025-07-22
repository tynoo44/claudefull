// Phrase matching functionality for response validation

import type { KeyPhrase } from './types';
import { normalizeText, stringSimilarity, containsSynonym } from './utils';

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