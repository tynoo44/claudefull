// Sistema avanzado de detección de intenciones para conversaciones de ventas
// Analiza el mensaje del lead para entender su verdadera intención
// Integrado con n8n para automatización de workflows

import { n8nIntegration } from './n8n-integration';

export interface DetectedIntent {
  primaryIntent: string;
  confidence: number;
  secondaryIntents: string[];
  emotionalTone: string;
  buyingSignals: number; // 0-10
  objectionType?: string;
  urgencyLevel: number; // 0-10
  context: {
    mentionsBusiness: boolean;
    mentionsPain: boolean;
    mentionsGoals: boolean;
    mentionsBudget: boolean;
    mentionsTimeframe: boolean;
    mentionsCompetitors: boolean;
  };
}

// Mapeo de palabras clave a intenciones
const INTENT_PATTERNS = {
  // Intenciones positivas
  high_interest: [
    'me interesa',
    'quiero saber',
    'cuéntame más',
    'necesito',
    'busco',
    'me gustaría',
    'estoy buscando',
    'dime más',
    'explícame',
    'cómo funciona',
    'qué incluye',
    'cuándo podemos',
    'perfecto',
    'genial',
    'vale',
  ],

  // Preguntas específicas
  specific_question: [
    'cuánto',
    'qué incluye',
    'cómo funciona',
    'cuándo',
    'dónde',
    'por qué',
    'quién',
    'garantía',
    'resultados',
    'casos de éxito',
  ],

  // Objeciones
  price_objection: [
    'caro',
    'precio',
    'cuánto cuesta',
    'presupuesto',
    'no tengo dinero',
    'es mucho',
    'barato',
    'descuento',
    'invertir',
    'gasto',
    'no puedo pagar',
  ],

  time_objection: [
    'no tengo tiempo',
    'ahora no',
    'más adelante',
    'ocupado',
    'liado',
    'después',
    'luego',
    'próximo mes',
    'próximo año',
    'cuando pueda',
  ],

  trust_objection: [
    'no sé',
    'no estoy seguro',
    'lo pienso',
    'déjame ver',
    'no confío',
    'es real',
    'estafa',
    'garantías',
    'pruebas',
    'testimonios',
  ],

  // Señales de compra
  buying_signals: [
    'cuándo empezamos',
    'qué necesito',
    'cómo me inscribo',
    'próximos pasos',
    'empezar ya',
    'lo quiero',
    'me apunto',
    'hagámoslo',
    'dale',
    'vamos',
  ],

  // Desinterés
  low_interest: [
    'no me interesa',
    'no gracias',
    'paso',
    'no necesito',
    'estoy bien',
    'no busco',
    'déjalo',
    'no molestes',
    'spam',
    'no quiero',
  ],

  // Información sobre negocio
  business_info: [
    'mi empresa',
    'mi negocio',
    'tengo una',
    'trabajo en',
    'me dedico',
    'vendo',
    'ofrezco',
    'servicio',
    'producto',
    'clientes',
    'facturación',
  ],

  // Dolor o frustración
  pain_expression: [
    'problema',
    'difícil',
    'complicado',
    'no consigo',
    'frustrado',
    'cansado de',
    'harto',
    'no funciona',
    'no sale',
    'atascado',
    'no sé cómo',
    'me cuesta',
    'batalla',
    'lucha',
  ],

  // Objetivos y metas
  goal_expression: [
    'quiero conseguir',
    'mi objetivo',
    'me gustaría',
    'aspiro',
    'sueño con',
    'meta',
    'lograr',
    'alcanzar',
    'llegar a',
    'crecer',
    'escalar',
  ],
};

// Tonos emocionales
const EMOTIONAL_TONES = {
  enthusiastic: ['genial', 'increíble', 'wow', 'perfecto', 'excelente', '!!!', 'me encanta'],
  neutral: ['ok', 'vale', 'bien', 'entiendo', 'claro', 'sí', 'no'],
  skeptical: ['no sé', 'puede ser', 'quizás', 'tal vez', 'a ver', 'bueno...'],
  frustrated: ['joder', 'mierda', 'coño', 'puto', 'harto', 'cansado', 'hasta los cojones'],
  professional: ['efectivamente', 'correcto', 'entiendo', 'comprendo', 'ciertamente'],
  casual: ['bro', 'tío', 'colega', 'jaja', 'lol', 'xd', 'jeje'],
};

// Función principal de detección
export function detectIntent(message: string, metadata?: { conversationId?: string; leadId?: string }): DetectedIntent {
  const lowerMessage = message.toLowerCase();
  const detectedIntents: { intent: string; matches: number }[] = [];

  // Buscar coincidencias con patrones de intención
  Object.entries(INTENT_PATTERNS).forEach(([intent, patterns]) => {
    const matches = patterns.filter(pattern => lowerMessage.includes(pattern)).length;
    if (matches > 0) {
      detectedIntents.push({ intent, matches });
    }
  });

  // Ordenar por número de coincidencias
  detectedIntents.sort((a, b) => b.matches - a.matches);

  // Determinar intención principal
  const primaryIntent = detectedIntents[0]?.intent || 'general_response';
  const confidence = Math.min((detectedIntents[0]?.matches || 0) / 3, 1); // Max 3 matches = 100% confidence

  // Intenciones secundarias
  const secondaryIntents = detectedIntents.slice(1, 3).map(d => d.intent);

  // Detectar tono emocional
  let emotionalTone = 'neutral';
  let maxToneMatches = 0;

  Object.entries(EMOTIONAL_TONES).forEach(([tone, patterns]) => {
    const matches = patterns.filter(pattern => lowerMessage.includes(pattern)).length;
    if (matches > maxToneMatches) {
      maxToneMatches = matches;
      emotionalTone = tone;
    }
  });

  // Calcular señales de compra (0-10)
  const buyingSignals = calculateBuyingSignals(lowerMessage, primaryIntent, emotionalTone);

  // Detectar tipo de objeción si aplica
  const objectionType = detectObjectionType(primaryIntent);

  // Calcular nivel de urgencia
  const urgencyLevel = calculateUrgencyLevel(lowerMessage);

  // Analizar contexto
  const context = {
    mentionsBusiness: INTENT_PATTERNS.business_info.some(p => lowerMessage.includes(p)),
    mentionsPain: INTENT_PATTERNS.pain_expression.some(p => lowerMessage.includes(p)),
    mentionsGoals: INTENT_PATTERNS.goal_expression.some(p => lowerMessage.includes(p)),
    mentionsBudget:
      lowerMessage.includes('presupuesto') ||
      lowerMessage.includes('inversión') ||
      lowerMessage.includes('€'),
    mentionsTimeframe:
      lowerMessage.includes('cuándo') ||
      lowerMessage.includes('mes') ||
      lowerMessage.includes('año'),
    mentionsCompetitors:
      lowerMessage.includes('otro') ||
      lowerMessage.includes('comparado') ||
      lowerMessage.includes('mejor que'),
  };

  const result: DetectedIntent = {
    primaryIntent,
    confidence,
    secondaryIntents,
    emotionalTone,
    buyingSignals,
    objectionType,
    urgencyLevel,
    context,
  };

  // Send to n8n webhook if enabled
  if (n8nIntegration.isEnabled() && metadata) {
    n8nIntegration.onIntentDetected({
      conversationId: metadata.conversationId,
      leadId: metadata.leadId,
      message,
      intent: result
    }).catch(err => console.error('[Intent Detector] N8N webhook error:', err));
  }

  return result;
}

// Calcular señales de compra
function calculateBuyingSignals(message: string, intent: string, tone: string): number {
  let score = 5; // Base neutral

  // Ajustar por intención
  if (intent === 'high_interest') score += 2;
  if (intent === 'buying_signals') score += 3;
  if (intent === 'specific_question') score += 1;
  if (intent === 'low_interest') score -= 3;
  if (intent.includes('objection')) score -= 1;

  // Ajustar por tono
  if (tone === 'enthusiastic') score += 1;
  if (tone === 'frustrated') score -= 1;
  if (tone === 'skeptical') score -= 1;

  // Palabras clave adicionales
  if (message.includes('ya') || message.includes('ahora')) score += 1;
  if (message.includes('necesito') || message.includes('urgente')) score += 2;

  return Math.max(0, Math.min(10, score));
}

// Detectar tipo de objeción
function detectObjectionType(intent: string): string | undefined {
  if (intent === 'price_objection') return 'price';
  if (intent === 'time_objection') return 'time';
  if (intent === 'trust_objection') return 'trust';
  return undefined;
}

// Calcular urgencia
function calculateUrgencyLevel(message: string): number {
  let urgency = 5; // Base neutral

  const urgentWords = ['ya', 'ahora', 'urgente', 'rápido', 'cuanto antes', 'necesito ya'];
  const delayWords = ['después', 'luego', 'más adelante', 'cuando pueda', 'no hay prisa'];

  urgentWords.forEach(word => {
    if (message.includes(word)) urgency += 2;
  });

  delayWords.forEach(word => {
    if (message.includes(word)) urgency -= 2;
  });

  return Math.max(0, Math.min(10, urgency));
}

// Función para obtener recomendaciones basadas en la intención
export function getIntentRecommendations(intent: DetectedIntent): string[] {
  const recommendations: string[] = [];

  switch (intent.primaryIntent) {
    case 'high_interest':
      recommendations.push('Profundiza en los beneficios específicos');
      recommendations.push('Pregunta sobre su situación actual');
      recommendations.push('Mueve hacia la siguiente fase del script');
      break;

    case 'price_objection':
      recommendations.push('No menciones precios específicos aún');
      recommendations.push('Enfócate en el valor y ROI');
      recommendations.push('Explora su capacidad real de inversión indirectamente');
      break;

    case 'time_objection':
      recommendations.push('Explora qué es lo que realmente le falta tiempo');
      recommendations.push('Muestra cómo el programa ahorra tiempo a largo plazo');
      recommendations.push('Pregunta cuándo sería el momento ideal');
      break;

    case 'low_interest':
      recommendations.push('Intenta un último re-engagement con valor');
      recommendations.push('Si persiste, descalifica amablemente');
      recommendations.push('Ofrece recurso gratuito si aplica');
      break;

    case 'pain_expression':
      recommendations.push('Profundiza en ese dolor específico');
      recommendations.push('Muestra empatía genuina');
      recommendations.push('Conecta el dolor con la solución');
      break;
  }

  // Recomendaciones por señales de compra
  if (intent.buyingSignals >= 7) {
    recommendations.push('Es momento de ofrecer la llamada');
    recommendations.push('Transmite confianza y seguridad');
  } else if (intent.buyingSignals <= 3) {
    recommendations.push('Necesitas generar más interés y valor');
    recommendations.push('Explora mejor sus necesidades');
  }

  return recommendations;
}

// Exportar tipos de intención para uso en otros módulos
export const INTENT_TYPES = {
  HIGH_INTEREST: 'high_interest',
  SPECIFIC_QUESTION: 'specific_question',
  PRICE_OBJECTION: 'price_objection',
  TIME_OBJECTION: 'time_objection',
  TRUST_OBJECTION: 'trust_objection',
  BUYING_SIGNALS: 'buying_signals',
  LOW_INTEREST: 'low_interest',
  BUSINESS_INFO: 'business_info',
  PAIN_EXPRESSION: 'pain_expression',
  GOAL_EXPRESSION: 'goal_expression',
  GENERAL_RESPONSE: 'general_response',
} as const;
