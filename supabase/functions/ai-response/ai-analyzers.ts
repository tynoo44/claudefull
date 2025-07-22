// AI Analysis modules for intent detection and lead personalization
// Migrated from src/lib/intent-detector.ts and src/lib/lead-personalizer.ts

export interface IntentAnalysis {
  primaryIntent: string;
  confidence: number;
  emotionalTone: string;
  buyingSignals: number;
  urgencyLevel: number;
  objectionType?: string;
  recommendations: string[];
}

export interface LeadProfile {
  type: string;
  ageGroup: string;
  communicationStyle: string;
  techSavviness: string;
  decisionMakingStyle: string;
  vocabularyLevel: string;
  sentenceLength: string;
  useSlang: boolean;
  persuasionStyle: string;
  examplePhrases: {
    greeting: string[];
    question: string[];
  };
}

export function detectIntent(message: string): IntentAnalysis {
  const text = message.toLowerCase();
  
  // Intent detection
  let primaryIntent = 'general_response';
  let confidence = 0.5;
  
  if (text.includes('no me interesa') || text.includes('no gracias') || text.includes('no necesito')) {
    primaryIntent = 'rejection';
    confidence = 0.9;
  } else if (text.includes('como funciona') || text.includes('que haces') || text.includes('que ofreces')) {
    primaryIntent = 'service_inquiry';
    confidence = 0.8;
  } else if (text.includes('precio') || text.includes('cost') || text.includes('cuanto')) {
    primaryIntent = 'price_inquiry';
    confidence = 0.85;
  } else if (text.includes('interesa') || text.includes('interesante')) {
    primaryIntent = 'interest_expression';
    confidence = 0.7;
  }
  
  // Emotional tone detection
  let emotionalTone = 'neutral';
  if (text.includes('frustrado') || text.includes('molesto') || text.includes('enojado')) {
    emotionalTone = 'frustrated';
  } else if (text.includes('emocionado') || text.includes('genial') || text.includes('perfecto')) {
    emotionalTone = 'excited';
  } else if (text.includes('confundido') || text.includes('no entiendo')) {
    emotionalTone = 'confused';
  } else if (text.includes('interesado') || text.includes('curioso')) {
    emotionalTone = 'interested';
  }
  
  // Buying signals (0-10 scale)
  let buyingSignals = 2;
  if (text.includes('cuando empezamos') || text.includes('como procedo')) buyingSignals = 9;
  else if (text.includes('precio') || text.includes('cuanto cuesta')) buyingSignals = 7;
  else if (text.includes('interesa') || text.includes('me gusta')) buyingSignals = 6;
  else if (text.includes('mas informacion') || text.includes('detalles')) buyingSignals = 5;
  else if (text.includes('no estoy seguro') || text.includes('tal vez')) buyingSignals = 3;
  else if (text.includes('no me interesa') || text.includes('no gracias')) buyingSignals = 1;
  
  // Urgency level (0-10 scale)
  let urgencyLevel = 3;
  if (text.includes('urgente') || text.includes('rapido') || text.includes('ya')) urgencyLevel = 9;
  else if (text.includes('pronto') || text.includes('cuanto antes')) urgencyLevel = 7;
  else if (text.includes('cuando puedo') || text.includes('disponible')) urgencyLevel = 6;
  else if (text.includes('tengo tiempo') || text.includes('sin prisa')) urgencyLevel = 2;
  
  // Objection type detection
  let objectionType: string | undefined;
  if (text.includes('no tengo dinero') || text.includes('muy caro')) {
    objectionType = 'price';
  } else if (text.includes('no tengo tiempo') || text.includes('muy ocupado')) {
    objectionType = 'time';
  } else if (text.includes('no creo') || text.includes('no funciona')) {
    objectionType = 'skepticism';
  } else if (text.includes('necesito pensarlo') || text.includes('hablar con')) {
    objectionType = 'decision_maker';
  }
  
  // Generate recommendations based on analysis
  const recommendations = generateIntentRecommendations(primaryIntent, emotionalTone, buyingSignals, objectionType);
  
  return {
    primaryIntent,
    confidence,
    emotionalTone,
    buyingSignals,
    urgencyLevel,
    objectionType,
    recommendations
  };
}

export function analyzeLeadProfile(messages: string[]): LeadProfile {
  const allText = messages.join(' ').toLowerCase();
  
  // Age group detection
  let ageGroup = 'adult';
  if (allText.includes('bro') || allText.includes('tio') || allText.includes('wey')) {
    ageGroup = 'young';
  } else if (allText.includes('usted') || allText.includes('señor') || allText.includes('disculpe')) {
    ageGroup = 'mature';
  }
  
  // Communication style
  let communicationStyle = 'neutral';
  if (allText.includes('jaja') || allText.includes('xd') || allText.includes('😂')) {
    communicationStyle = 'casual';
  } else if (allText.includes('estimado') || allText.includes('cordialmente')) {
    communicationStyle = 'formal';
  } else if (allText.includes('bro') || allText.includes('colega')) {
    communicationStyle = 'friendly';
  }
  
  // Tech savviness
  let techSavviness = 'basic';
  if (allText.includes('app') || allText.includes('software') || allText.includes('digital')) {
    techSavviness = 'advanced';
  } else if (allText.includes('no entiendo') || allText.includes('complicado')) {
    techSavviness = 'basic';
  } else {
    techSavviness = 'intermediate';
  }
  
  // Decision making style
  let decisionMakingStyle = 'analytical';
  if (allText.includes('rapido') || allText.includes('ya') || allText.includes('ahora')) {
    decisionMakingStyle = 'impulsive';
  } else if (allText.includes('pensarlo') || allText.includes('comparar') || allText.includes('analizar')) {
    decisionMakingStyle = 'analytical';
  } else if (allText.includes('sentimiento') || allText.includes('me gusta') || allText.includes('siento')) {
    decisionMakingStyle = 'emotional';
  }
  
  // Business type detection
  let type = 'general';
  if (allText.includes('youtube') || allText.includes('canal')) {
    type = 'youtube';
  } else if (allText.includes('tienda') || allText.includes('ecommerce')) {
    type = 'ecommerce';
  } else if (allText.includes('servicio') || allText.includes('consultoria')) {
    type = 'service';
  }
  
  // Generate personalization rules
  const personalizationRules = generatePersonalizationRules(ageGroup, communicationStyle, techSavviness, decisionMakingStyle);
  
  return {
    type,
    ageGroup,
    communicationStyle,
    techSavviness,
    decisionMakingStyle,
    ...personalizationRules
  };
}

function generateIntentRecommendations(
  primaryIntent: string,
  emotionalTone: string,
  buyingSignals: number,
  objectionType?: string
): string[] {
  const recommendations: string[] = [];
  
  switch (primaryIntent) {
    case 'rejection':
      recommendations.push('Acknowledge their position respectfully');
      recommendations.push('Ask about what would change their mind');
      recommendations.push('Offer to stay in touch for future needs');
      break;
      
    case 'service_inquiry':
      recommendations.push('Provide clear, specific value proposition');
      recommendations.push('Use concrete examples or case studies');
      recommendations.push('Ask about their specific situation');
      break;
      
    case 'price_inquiry':
      if (buyingSignals >= 6) {
        recommendations.push('Present price with value justification');
        recommendations.push('Offer payment options or packages');
      } else {
        recommendations.push('Focus on value before discussing price');
        recommendations.push('Ask about their budget or investment capacity');
      }
      break;
      
    case 'interest_expression':
      recommendations.push('Build on their interest with specific benefits');
      recommendations.push('Move toward next step or call scheduling');
      recommendations.push('Ask qualifying questions');
      break;
  }
  
  // Add recommendations based on emotional tone
  switch (emotionalTone) {
    case 'frustrated':
      recommendations.push('Acknowledge their frustration empathetically');
      recommendations.push('Focus on how you can solve their problem');
      break;
      
    case 'confused':
      recommendations.push('Simplify your explanation');
      recommendations.push('Use analogies or examples they can relate to');
      break;
      
    case 'excited':
      recommendations.push('Match their energy level');
      recommendations.push('Move quickly toward next steps');
      break;
  }
  
  return recommendations.length > 0 ? recommendations : ['Maintain natural conversation flow'];
}

function generatePersonalizationRules(
  ageGroup: string,
  communicationStyle: string,
  techSavviness: string,
  decisionMakingStyle: string
) {
  let vocabularyLevel = 'intermediate';
  let sentenceLength = 'medium';
  let useSlang = false;
  let persuasionStyle = 'logical';
  
  // Adjust based on age group
  if (ageGroup === 'young') {
    vocabularyLevel = 'casual';
    useSlang = true;
    sentenceLength = 'short';
  } else if (ageGroup === 'mature') {
    vocabularyLevel = 'formal';
    useSlang = false;
    sentenceLength = 'medium';
  }
  
  // Adjust based on communication style
  if (communicationStyle === 'casual') {
    useSlang = true;
    sentenceLength = 'short';
  } else if (communicationStyle === 'formal') {
    vocabularyLevel = 'professional';
    useSlang = false;
  }
  
  // Adjust persuasion style based on decision making
  if (decisionMakingStyle === 'emotional') {
    persuasionStyle = 'emotional';
  } else if (decisionMakingStyle === 'impulsive') {
    persuasionStyle = 'urgency';
  } else {
    persuasionStyle = 'logical';
  }
  
  // Generate example phrases
  const examplePhrases = generateExamplePhrases(ageGroup, communicationStyle, useSlang);
  
  return {
    vocabularyLevel,
    sentenceLength,
    useSlang,
    persuasionStyle,
    examplePhrases
  };
}

function generateExamplePhrases(ageGroup: string, communicationStyle: string, useSlang: boolean) {
  const phrases = {
    greeting: [] as string[],
    question: [] as string[]
  };
  
  if (ageGroup === 'young' && useSlang) {
    phrases.greeting.push('Que tal bro', 'Hey tio', 'Como andas');
    phrases.question.push('Me cuentas como va eso', 'Que opinas de esto', 'Te parece si hablamos');
  } else if (ageGroup === 'mature') {
    phrases.greeting.push('Buenos dias', 'Como esta usted', 'Espero se encuentre bien');
    phrases.question.push('Me podria comentar', 'Que opinion le merece', 'Le parece conveniente');
  } else {
    phrases.greeting.push('Hola', 'Como estas', 'Que tal todo');
    phrases.question.push('Me cuentas', 'Que piensas', 'Te parece bien');
  }
  
  return phrases;
}