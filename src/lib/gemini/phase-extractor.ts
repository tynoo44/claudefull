// Phase information extraction utilities

import type { AIMessage, PhaseInfo } from './types';

// Extract phase-specific information from conversation
export const extractPhaseInfo = (messages: AIMessage[], currentPhase: number): PhaseInfo => {
  const phaseInfo: PhaseInfo = {};
  const conversationText = messages
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Phase 1: Current Situation
  if (currentPhase >= 1) {
    // Business type detection
    if (conversationText.includes('youtube') || conversationText.includes('canal')) {
      phaseInfo.business_type = 'youtube';
    } else if (conversationText.includes('tienda') || conversationText.includes('ecommerce')) {
      phaseInfo.business_type = 'ecommerce';
    } else if (conversationText.includes('servicio') || conversationText.includes('consultoria')) {
      phaseInfo.business_type = 'service';
    }

    // Business age detection
    const agePatterns = {
      'nuevo': 'new',
      'empezando': 'new',
      'arranque': 'new',
      'año': 'established',
      'años': 'established',
      'tiempo': 'established',
    };

    for (const [pattern, age] of Object.entries(agePatterns)) {
      if (conversationText.includes(pattern)) {
        phaseInfo.business_age = age;
        break;
      }
    }
  }

  // Phase 2: Pain Points
  if (currentPhase >= 2) {
    const painIndicators = [
      'problema',
      'dificultad',
      'frustra',
      'complica',
      'no puedo',
      'no logro',
      'no consigo',
      'cuesta',
      'difícil',
    ];
    
    phaseInfo.pain_identified = painIndicators.some(indicator => 
      conversationText.includes(indicator)
    );
  }

  // Phase 3: Desired Situation
  if (currentPhase >= 3) {
    const goalIndicators = [
      'quiero',
      'me gustaría',
      'objetivo',
      'meta',
      'lograr',
      'conseguir',
      'alcanzar',
    ];
    
    phaseInfo.goals_defined = goalIndicators.some(indicator => 
      conversationText.includes(indicator)
    );
  }

  // Phase 4: Obstacles
  if (currentPhase >= 4) {
    const obstacleIndicators = [
      'pero',
      'sin embargo',
      'el problema es',
      'lo que pasa',
      'no sé',
      'no tengo',
      'me falta',
    ];
    
    phaseInfo.obstacles_identified = obstacleIndicators.some(indicator => 
      conversationText.includes(indicator)
    );
  }

  // Phase 5: Offer
  if (currentPhase >= 5) {
    const offerIndicators = [
      'llamada',
      'agendar',
      'reunión',
      'hablar',
      'explicar',
      'mostrar',
      'presentar',
    ];
    
    phaseInfo.offer_discussed = offerIndicators.some(indicator => 
      conversationText.includes(indicator)
    );
  }

  return phaseInfo;
};

// Extract intent from user message
export const extractIntent = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  // Direct objections
  if (
    lowerMessage.includes('no me interesa') ||
    lowerMessage.includes('no gracias') ||
    lowerMessage.includes('no necesito')
  ) {
    return 'rejection';
  }

  // Questions about service
  if (
    lowerMessage.includes('como funciona') ||
    lowerMessage.includes('que haces') ||
    lowerMessage.includes('que ofreces')
  ) {
    return 'service_inquiry';
  }

  // Price questions
  if (
    lowerMessage.includes('precio') ||
    lowerMessage.includes('cost') ||
    lowerMessage.includes('cuanto')
  ) {
    return 'price_inquiry';
  }

  if (lowerMessage.includes('interesa') || lowerMessage.includes('interesante')) {
    return 'interest_expression';
  }

  return 'general_response';
};