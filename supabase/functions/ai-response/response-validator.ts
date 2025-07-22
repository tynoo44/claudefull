// Response validation for AI-generated content
// Migrated from src/lib/response-validator/

export interface ValidationResult {
  score: number;
  suggestions: string[];
  isValid: boolean;
}

export interface ValidationConfig {
  minScore: number;
  keyPhraseWeight: number;
  strictMode: boolean;
  regenerateThreshold: number;
  maxRegenerationAttempts: number;
}

export async function validateResponse(
  response: string,
  currentPhase: number,
  leadType: string | undefined,
  config: ValidationConfig
): Promise<ValidationResult> {
  try {
    let score = 0.5; // Base score
    const suggestions: string[] = [];
    
    // Basic validation checks
    if (!response || response.trim().length === 0) {
      return {
        score: 0,
        suggestions: ['Response is empty'],
        isValid: false
      };
    }
    
    // Length validation - prefer shorter messages
    const messageLength = response.trim().length;
    if (messageLength > 500) {
      score -= 0.2;
      suggestions.push('Message is too long - keep it under 3 lines');
    } else if (messageLength < 20) {
      score -= 0.1;
      suggestions.push('Message might be too short - add more value');
    } else if (messageLength <= 200) {
      score += 0.1; // Bonus for good length
    }
    
    // Natural language checks
    const text = response.toLowerCase();
    
    // Check for prohibited patterns (robotic language)
    const roboticPatterns = [
      /^¿/, // Starting with ¿
      /^¡/, // Starting with ¡
      /estimado\/a cliente/i,
      /cordialmente/i,
      /sin otro particular/i,
      /atentamente/i
    ];
    
    for (const pattern of roboticPatterns) {
      if (pattern.test(response)) {
        score -= 0.3;
        suggestions.push('Remove formal/robotic language - be more natural');
        break;
      }
    }
    
    // Check for natural conversation patterns
    const naturalPatterns = [
      /\b(como|que|cuando|donde)\b/g, // Question words without ¿
      /\b(bueno|vale|ok|perfecto|genial)\b/g, // Natural connectors
      /\b(mira|oye|sabes|imaginate)\b/g, // Conversational starters
    ];
    
    let naturalityBonus = 0;
    for (const pattern of naturalPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        naturalityBonus += matches.length * 0.05;
      }
    }
    score += Math.min(naturalityBonus, 0.2); // Max 0.2 bonus
    
    // Phase-specific validation
    if (currentPhase) {
      const phaseScore = validatePhaseRelevance(response, currentPhase);
      score += phaseScore * 0.3; // Phase relevance worth 30% of score
      
      if (phaseScore < 0.3) {
        suggestions.push(`Response doesn't seem relevant to phase ${currentPhase}`);
      }
    }
    
    // Lead type validation
    if (leadType) {
      const leadTypeScore = validateLeadTypeRelevance(response, leadType);
      score += leadTypeScore * 0.1; // Lead type worth 10% of score
    }
    
    // Engagement validation
    const engagementScore = validateEngagement(response);
    score += engagementScore * 0.2; // Engagement worth 20% of score
    
    if (engagementScore < 0.4) {
      suggestions.push('Make the message more engaging - ask a question or create curiosity');
    }
    
    // Spanish informal validation
    const informalityScore = validateInformality(response);
    score += informalityScore * 0.1; // Informality worth 10% of score
    
    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));
    
    return {
      score,
      suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
      isValid: score >= config.minScore
    };
    
  } catch (error) {
    console.error('Error validating response:', error);
    return {
      score: 0.3, // Default acceptable score
      suggestions: ['Validation error occurred'],
      isValid: true // Don't block on validation errors
    };
  }
}

function validatePhaseRelevance(response: string, phase: number): number {
  const text = response.toLowerCase();
  let relevanceScore = 0.5; // Base relevance
  
  switch (phase) {
    case 1: // Current situation
      const situationKeywords = ['actual', 'ahora', 'momento', 'situacion', 'como esta', 'donde'];
      if (situationKeywords.some(keyword => text.includes(keyword))) {
        relevanceScore += 0.3;
      }
      break;
      
    case 2: // Pain
      const painKeywords = ['problema', 'dificult', 'frustra', 'complica', 'duele'];
      if (painKeywords.some(keyword => text.includes(keyword))) {
        relevanceScore += 0.3;
      }
      break;
      
    case 3: // Desired situation
      const goalKeywords = ['quiere', 'objetivo', 'meta', 'lograr', 'conseguir', 'ideal'];
      if (goalKeywords.some(keyword => text.includes(keyword))) {
        relevanceScore += 0.3;
      }
      break;
      
    case 4: // Obstacles
      const obstacleKeywords = ['impide', 'bloquea', 'dificil', 'pero', 'sin embargo', 'problema'];
      if (obstacleKeywords.some(keyword => text.includes(keyword))) {
        relevanceScore += 0.3;
      }
      break;
      
    case 5: // Offer
      const offerKeywords = ['llamada', 'hablar', 'reunir', 'explicar', 'mostrar', 'agenda'];
      if (offerKeywords.some(keyword => text.includes(keyword))) {
        relevanceScore += 0.3;
      }
      break;
  }
  
  return Math.min(1, relevanceScore);
}

function validateLeadTypeRelevance(response: string, leadType: string): number {
  const text = response.toLowerCase();
  let relevanceScore = 0.5;
  
  switch (leadType) {
    case 'youtube':
      if (text.includes('canal') || text.includes('video') || text.includes('contenido')) {
        relevanceScore += 0.3;
      }
      break;
      
    case 'ecommerce':
      if (text.includes('tienda') || text.includes('venta') || text.includes('producto')) {
        relevanceScore += 0.3;
      }
      break;
      
    case 'service':
      if (text.includes('servicio') || text.includes('cliente') || text.includes('consultor')) {
        relevanceScore += 0.3;
      }
      break;
  }
  
  return Math.min(1, relevanceScore);
}

function validateEngagement(response: string): number {
  const text = response.toLowerCase();
  let engagementScore = 0.3; // Base score
  
  // Questions increase engagement
  const questionPatterns = [
    /como te va/g,
    /que tal/g,
    /me cuentas/g,
    /que opinas/g,
    /te parece/g,
    /\?/g // Any question mark
  ];
  
  for (const pattern of questionPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      engagementScore += matches.length * 0.15;
    }
  }
  
  // Curiosity-building phrases
  const curiosityPatterns = [
    /imaginate/g,
    /te voy a contar/g,
    /sabias que/g,
    /por ejemplo/g,
    /resulta que/g
  ];
  
  for (const pattern of curiosityPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      engagementScore += matches.length * 0.1;
    }
  }
  
  // Personal connection
  if (text.includes('entiendo') || text.includes('comprendo') || text.includes('me paso lo mismo')) {
    engagementScore += 0.15;
  }
  
  return Math.min(1, engagementScore);
}

function validateInformality(response: string): number {
  const text = response.toLowerCase();
  let informalityScore = 0.5;
  
  // Good informal patterns
  const informalPatterns = [
    /\b(bueno|vale|ok|claro|perfecto)\b/g,
    /\b(mira|oye|sabes)\b/g,
    /\b(genial|brutal|increible)\b/g,
    /\b(tio|bro|colega)\b/g // If appropriate for age group
  ];
  
  for (const pattern of informalPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      informalityScore += matches.length * 0.1;
    }
  }
  
  // Penalty for overly formal language
  const formalPatterns = [
    /\busted\b/g,
    /\bestimado\b/g,
    /\bcordialmente\b/g,
    /\batentamente\b/g
  ];
  
  for (const pattern of formalPatterns) {
    if (pattern.test(text)) {
      informalityScore -= 0.3;
    }
  }
  
  return Math.max(0, Math.min(1, informalityScore));
}