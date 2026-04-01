// Sentiment analysis module - extracted from conversationAnalysisService

import { ConversationMessage } from './types';

interface SentimentResult {
  overall: number;
  timeline: Array<{ timestamp: Date; score: number; emotion: string }>;
  by_message?: Array<{ message_id: string; score: number; emotion: string }>;
}

const emotionKeywords = {
  frustración: ['frustrado', 'harto', 'cansado', 'difícil', 'problema', 'no puedo'],
  entusiasmo: ['genial', 'perfecto', 'me encanta', 'increíble', 'excelente'],
  duda: ['no sé', 'quizás', 'tal vez', 'no estoy seguro', 'puede ser'],
  urgencia: ['ya', 'ahora', 'urgente', 'necesito', 'cuanto antes'],
  escepticismo: ['no creo', 'suena bien pero', 'a ver', 'veremos'],
};

export function analyzeSentiments(messages: ConversationMessage[]): SentimentResult {
  const byMessage = messages.map((msg, index) => {
    const text = msg.text.toLowerCase();
    let score = 0;
    let emotion = 'neutral';

    // Detectar emoción dominante
    for (const [emo, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        emotion = emo;
        break;
      }
    }

    // Calcular score básico
    if (text.includes('!') || text.includes('genial') || text.includes('perfecto')) {
      score = 0.5;
    } else if (text.includes('no') || text.includes('problema') || text.includes('difícil')) {
      score = -0.5;
    }

    return {
      message_id: msg.id || `msg-${index}`,
      score,
      emotion,
    };
  });

  const overall = byMessage.reduce((acc, curr) => acc + curr.score, 0) / byMessage.length;

  return {
    overall,
    timeline: byMessage.map(msg => ({
      timestamp: new Date(),
      score: msg.score,
      emotion: msg.emotion,
    })),
    by_message: byMessage,
  };
}
