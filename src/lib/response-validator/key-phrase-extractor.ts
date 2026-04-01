// Key phrase extraction functionality for response validation

import type { ScriptTemplate } from '../prompt-manager';
import type { KeyPhrase } from './types';

// Extract key phrases from a single template
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
