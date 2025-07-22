// Prompt building functionality for Edge Functions
// Migrated from src/lib/gemini/prompt-builder.ts

export function buildHierarchicalPrompt(components: any, messages: any[]): string {
  const { basePrompt, scriptTemplates, fewShotExamples } = components;
  
  let prompt = '';
  
  // Start with base prompt if available
  if (basePrompt?.content) {
    prompt += basePrompt.content;
  } else {
    // Fallback base prompt
    prompt += `Eres un asistente AI especializado en appointment setting para el sector B2B.

CONTEXTO:
Ayudas a setters profesionales a generar respuestas naturales y efectivas para conseguir citas con leads potenciales.

METODOLOGÍA: Quantum Creators - 5 Fases
1. Situación Actual - Entender donde está el lead ahora
2. Dolor - Identificar frustraciones y problemas
3. Situación Deseada - Descubrir objetivos y metas
4. Obstáculo - Encontrar qué les impide llegar ahí
5. Oferta - Presentar la llamada como solución

REGLAS DE ESCRITURA OBLIGATORIAS:
- Escribe como en WhatsApp/Instagram - natural e informal
- NUNCA uses ¿ o ¡ al inicio de frases
- Máximo 2-3 líneas por mensaje
- Adapta tu tono al del lead (formal/informal)
- Si es joven puedes usar: bro, tio, colega
- Si es mayor: mantén respeto pero sin ser robot
- Evita comillas innecesarias
- Sé directo y va al grano`;
  }
  
  // Add script templates if available
  if (scriptTemplates && scriptTemplates.length > 0) {
    prompt += '\n\n# TEMPLATES DE SCRIPT PARA ESTA FASE\n';
    prompt += formatScriptTemplates(scriptTemplates);
  }
  
  // Add few-shot examples if available
  if (fewShotExamples && fewShotExamples.length > 0) {
    prompt += '\n\n# EJEMPLOS DE CONVERSACIONES EXITOSAS\n';
    prompt += formatFewShotExamples(fewShotExamples);
  }
  
  // Add conversation history
  if (messages && messages.length > 0) {
    prompt += '\n\n# CONVERSACIÓN ACTUAL\n';
    prompt += formatConversationHistory(messages);
    prompt += '\n\nGenera una respuesta natural y efectiva como setter:';
  }
  
  return prompt;
}

function formatScriptTemplates(templates: any[]): string {
  return templates
    .sort((a, b) => b.priority - a.priority) // Sort by priority descending
    .map(template => `- ${template.content}`)
    .join('\n');
}

function formatFewShotExamples(examples: any[]): string {
  return examples
    .map(example => {
      const context = example.context ? `\nContexto: ${example.context}` : '';
      return `Lead: ${example.example_input}\nSetter: ${example.example_output}${context}`;
    })
    .join('\n\n');
}

function formatConversationHistory(messages: any[]): string {
  return messages
    .map(msg => {
      const role = msg.role === 'user' ? 'Lead' : 'Setter';
      return `${role}: ${msg.content}`;
    })
    .join('\n');
}

// Extract phase-specific information from conversation
export function extractPhaseInfo(messages: any[], currentPhase: number): any {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const allText = userMessages.join(' ').toLowerCase();
  
  const phaseInfo: any = {};
  
  // Phase 1: Current situation
  if (currentPhase >= 1) {
    if (allText.includes('youtube') || allText.includes('canal')) {
      phaseInfo.business_type = 'youtube';
    } else if (allText.includes('tienda') || allText.includes('ecommerce')) {
      phaseInfo.business_type = 'ecommerce';
    } else if (allText.includes('servicio') || allText.includes('consultoria')) {
      phaseInfo.business_type = 'service';
    }
    
    // Business age detection
    const ageKeywords = {
      'nuevo': 'new',
      'empezando': 'new', 
      'arranque': 'new',
      'año': 'established',
      'años': 'established',
      'tiempo': 'established'
    };
    
    for (const [keyword, value] of Object.entries(ageKeywords)) {
      if (allText.includes(keyword)) {
        phaseInfo.business_age = value;
        break;
      }
    }
  }
  
  // Phase 2: Pain points
  if (currentPhase >= 2) {
    const painKeywords = [
      'problema', 'dificultad', 'frustra', 'complica',
      'no puedo', 'no logro', 'no consigo', 'cuesta', 'difícil'
    ];
    phaseInfo.pain_identified = painKeywords.some(keyword => allText.includes(keyword));
  }
  
  // Phase 3: Desired situation
  if (currentPhase >= 3) {
    const goalKeywords = [
      'quiero', 'me gustaría', 'objetivo', 'meta',
      'lograr', 'conseguir', 'alcanzar'
    ];
    phaseInfo.goals_defined = goalKeywords.some(keyword => allText.includes(keyword));
  }
  
  // Phase 4: Obstacles
  if (currentPhase >= 4) {
    const obstacleKeywords = [
      'pero', 'sin embargo', 'el problema es', 'lo que pasa',
      'no sé', 'no tengo', 'me falta'
    ];
    phaseInfo.obstacles_identified = obstacleKeywords.some(keyword => allText.includes(keyword));
  }
  
  // Phase 5: Offer discussion
  if (currentPhase >= 5) {
    const offerKeywords = [
      'llamada', 'agendar', 'reunión', 'hablar',
      'explicar', 'mostrar', 'presentar'
    ];
    phaseInfo.offer_discussed = offerKeywords.some(keyword => allText.includes(keyword));
  }
  
  return phaseInfo;
}

// Extract intent from user message
export function extractIntent(userMessage: string): string {
  const text = userMessage.toLowerCase();
  
  if (text.includes('no me interesa') || text.includes('no gracias') || text.includes('no necesito')) {
    return 'rejection';
  }
  if (text.includes('como funciona') || text.includes('que haces') || text.includes('que ofreces')) {
    return 'service_inquiry';
  }
  if (text.includes('precio') || text.includes('cost') || text.includes('cuanto')) {
    return 'price_inquiry';
  }
  if (text.includes('interesa') || text.includes('interesante')) {
    return 'interest_expression';
  }
  
  return 'general_response';
}