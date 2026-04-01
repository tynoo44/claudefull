// Text processing utilities for response validation

import { SYNONYM_MAP } from './constants';

// Normalize text for comparison
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate Levenshtein distance between two strings
export function levenshteinDistance(str1: string, str2: string): number {
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
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

// Calculate string similarity (0 to 1)
export function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength > 0 ? 1 - distance / maxLength : 1;
}

// Check if a phrase contains a synonym of the target word
export function containsSynonym(phrase: string, targetWord: string): boolean {
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
