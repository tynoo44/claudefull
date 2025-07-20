import { GoogleGenerativeAI } from '@google/generative-ai';
import { APPOINTMENT_SETTING_CONTEXT } from './appointment-setting-context';
import { promptManager, PromptComponents } from './prompt-manager';
import { responseValidator, ValidationConfig } from './response-validator';
import { ConversationStateManager } from './conversation-state-manager';
import { detectIntent, getIntentRecommendations } from './intent-detector';
import { analyzeLeadProfile, getPersonalizationRules } from './lead-personalizer';

interface PhaseInfo {
  business_type?: string;
  business_age?: string;
  pain_identified?: boolean;
  goals_defined?: boolean;
  obstacles_identified?: boolean;
  offer_discussed?: boolean;
  [key: string]: unknown;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Available models
export const GEMINI_MODELS = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
} as const;

export type GeminiModel = keyof typeof GEMINI_MODELS;

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GenerateResponseOptions {
  messages: AIMessage[];
  model: GeminiModel;
  conversationContext?: string;
  currentPhase?: number;
  leadType?: string;
  conversationId?: string;
  leadId?: string;
  enableTracking?: boolean;
}

// Build hierarchical prompt from components
const buildHierarchicalPrompt = (components: PromptComponents, messages: AIMessage[]): string => {
  const parts: string[] = [];

  // 1. Base prompt with role definition and system instructions
  if (components.basePrompt) {
    if (components.basePrompt.role_definition) {
      parts.push(`# ROL Y CONTEXTO\n${components.basePrompt.role_definition}`);
    }

    if (components.basePrompt.system_instructions) {
      parts.push(`# INSTRUCCIONES DEL SISTEMA\n${components.basePrompt.system_instructions}`);
    }

    parts.push(`# INFORMACIÓN DEL SERVICIO\n${components.basePrompt.content}`);
  } else {
    // Fallback to original prompt if no base prompt found
    parts.push(`Eres un asistente IA general, capaz de ayudar con cualquier pregunta o tarea.

Tu especialidad es el appointment setting, y tienes conocimiento experto sobre:
${APPOINTMENT_SETTING_CONTEXT}`);
  }

  // 2. Script templates for current phase
  if (components.scriptTemplates.length > 0) {
    parts.push(
      `# SCRIPTS PARA FASE ${components.currentPhase}\n${promptManager.formatScriptTemplates(components.scriptTemplates)}`,
    );
  }

  // 3. Few-shot examples
  if (components.fewShotExamples.length > 0) {
    parts.push(
      `# EJEMPLOS DE EXCELENCIA\n${promptManager.formatFewShotExamples(components.fewShotExamples)}`,
    );
  }

  // 4. Conversation context if provided
  if (components.conversationContext) {
    parts.push(`# CONTEXTO DE LA CONVERSACIÓN\n${components.conversationContext}`);
  }

  // 5. Chat history
  parts.push(`# HISTORIAL DEL CHAT
${messages.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`).join('\n')}`);

  // 6. Response format instructions
  if (components.basePrompt?.content.includes('Formato de Respuesta')) {
    // Use format from database
  } else {
    parts.push(`# FORMATO DE RESPUESTA OBLIGATORIO

REGLAS ESENCIALES (DEBES CUMPLIR TODAS):
- NUNCA uses ¿ o ¡ (la gente real no los usa en chats)
- NO uses "comillas" a menos que sea absolutamente necesario
- Escribe de forma INFORMAL pero profesional
- USA lenguaje coloquial cuando sea apropiado: "bro", "jefe", "tio", "colega"
- Puedes usar "joder" o expresiones casuales SI el lead también las usa
- EVITA párrafos largos - máximo 2-3 líneas por mensaje
- NO repitas el nombre del lead constantemente
- Sé directo y al grano, sin rodeos innecesarios

ADAPTACIÓN AL LEAD:
- Si el lead es joven/informal → usa "bro", "tio", lenguaje más casual
- Si el lead es formal/empresario → mantén respeto pero sé cercano
- SIEMPRE adapta tu tono al del lead - espéjalo sutilmente

CÓMO ESCRIBIR:
- En vez de: "¿Cuál es tu principal problema?" 
- Escribe: "Cuéntame, qué es lo que más te frustra ahora mismo"
- En vez de: "¡Excelente! Me alegra mucho escuchar eso"
- Escribe: "Genial tio, eso está muy bien"

OBJETIVO: Que el lead sienta que habla con un colega experto que le puede ayudar, NO con un vendedor o un bot`);
  }

  return parts.join('\n\n');
};

export const generateAIResponse = async ({
  messages,
  model,
  conversationContext,
  currentPhase,
  leadType,
  conversationId,
  leadId,
  enableTracking = true,
}: GenerateResponseOptions): Promise<string> => {
  try {
    const geminiModel = genAI.getGenerativeModel({ model });

    // Build prompt components from database
    const components = await promptManager.buildPromptComponents(
      'main',
      currentPhase,
      leadType,
      conversationContext,
    );

    // Detectar intención y perfil del lead
    let intentContext = '';
    let personalizationContext = '';

    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);

      if (lastUserMessage.role === 'user') {
        // Análisis de intención
        const intent = detectIntent(lastUserMessage.content);
        const recommendations = getIntentRecommendations(intent);

        // Análisis de perfil del lead
        const leadProfile = analyzeLeadProfile(userMessages);
        const personalizationRules = getPersonalizationRules(leadProfile);

        // Contexto de intención
        intentContext = `\n\n# ANÁLISIS DE INTENCIÓN DEL LEAD
- Intención detectada: ${intent.primaryIntent} (confianza: ${Math.round(intent.confidence * 100)}%)
- Tono emocional: ${intent.emotionalTone}
- Señales de compra: ${intent.buyingSignals}/10
- Nivel de urgencia: ${intent.urgencyLevel}/10
${intent.objectionType ? `- Tipo de objeción: ${intent.objectionType}` : ''}

RECOMENDACIONES:
${recommendations.map((r: string) => `- ${r}`).join('\n')}`;

        // Contexto de personalización
        personalizationContext = `\n\n# PERFIL Y PERSONALIZACIÓN DEL LEAD
- Tipo de lead: ${leadProfile.type}
- Grupo de edad: ${leadProfile.ageGroup}
- Estilo de comunicación: ${leadProfile.communicationStyle}
- Nivel técnico: ${leadProfile.techSavviness}
- Estilo de decisión: ${leadProfile.decisionMakingStyle}

REGLAS DE PERSONALIZACIÓN:
- Usa vocabulario: ${personalizationRules.vocabularyLevel}
- Longitud de frases: ${personalizationRules.sentenceLength}
- Usar jerga/slang: ${personalizationRules.useSlang ? 'SÍ' : 'NO'}
- Estilo de persuasión: ${personalizationRules.persuasionStyle}

EJEMPLOS DE FRASES PARA ESTE LEAD:
${personalizationRules.examplePhrases.greeting.length > 0 ? `Saludos: ${personalizationRules.examplePhrases.greeting[0]}` : ''}
${personalizationRules.examplePhrases.question.length > 0 ? `Preguntas: ${personalizationRules.examplePhrases.question[0]}` : ''}`;
      }
    }

    // Build the hierarchical prompt with intent and personalization context
    const basePrompt = buildHierarchicalPrompt(components, messages);
    const fullPrompt = basePrompt + intentContext + personalizationContext;

    // Validation configuration - Muy permisivo para respuestas naturales
    const validationConfig: ValidationConfig = {
      minScore: 0.4, // Muy bajo para permitir creatividad
      keyPhraseWeight: 0.5, // Menos énfasis en frases exactas
      strictMode: false,
      regenerateThreshold: 0.2, // Solo regenerar si es terrible
      maxRegenerationAttempts: 1, // Evitar sobre-optimización
    };

    let attempts = 0;
    let bestResponse = '';
    let bestScore = 0;

    while (attempts < validationConfig.maxRegenerationAttempts) {
      // Generate response
      const result = await geminiModel.generateContent(fullPrompt);
      const response = await result.response;
      const generatedText = response.text();

      // Validate if we have a current phase
      if (currentPhase && currentPhase >= 1 && currentPhase <= 5) {
        const validation = await responseValidator.validate(
          generatedText,
          currentPhase,
          leadType,
          validationConfig,
        );

        console.log(`Validation attempt ${attempts + 1}:`, {
          phase: currentPhase,
          score: validation.score,
          suggestions: validation.suggestions,
        });

        // Keep track of best response
        if (validation.score > bestScore) {
          bestScore = validation.score;
          bestResponse = generatedText;
        }

        // If score is acceptable, return the response
        if (validation.score >= validationConfig.minScore) {
          return generatedText;
        }

        // If score is too low and we have more attempts, regenerate with hints
        if (
          validation.score < validationConfig.regenerateThreshold &&
          attempts < validationConfig.maxRegenerationAttempts - 1
        ) {
          // Add validation hints to the prompt
          const hintsPrompt =
            fullPrompt + `\n\n# MEJORAS REQUERIDAS:\n${validation.suggestions.join('\n')}`;

          attempts++;

          // Regenerate with hints
          const hintedResult = await geminiModel.generateContent(hintsPrompt);
          const hintedResponse = await hintedResult.response;
          const hintedText = hintedResponse.text();

          // Validate the new response
          const hintedValidation = await responseValidator.validate(
            hintedText,
            currentPhase,
            leadType,
            validationConfig,
          );

          if (hintedValidation.score > bestScore) {
            bestScore = hintedValidation.score;
            bestResponse = hintedText;
          }

          if (hintedValidation.score >= validationConfig.minScore) {
            return hintedText;
          }
        }
      } else {
        // No phase specified, return without validation
        return generatedText;
      }

      attempts++;
    }

    // Return best response found
    console.log(`Returning best response with score: ${bestScore}`);

    // Update conversation state tracking if enabled
    if (enableTracking && conversationId && messages.length > 0) {
      try {
        const userMessage = messages[messages.length - 1]?.content || '';
        const detectedPhase = currentPhase || promptManager.detectCurrentPhase(messages);

        // Extract phase-specific information from the conversation
        const phaseInfo = extractPhaseInfo(messages, detectedPhase);

        const trackingResult = await ConversationStateManager.updateConversationState({
          conversationId: conversationId,
          leadId: leadId || '',
          userMessage: userMessage,
          aiResponse: bestResponse,
          currentPhase: detectedPhase,
          phaseInfo: phaseInfo,
          detectedIntent: extractIntent(userMessage),
        });

        if (trackingResult.success) {
          console.log('Conversation state updated:', {
            conversation_id: conversationId,
            phase: trackingResult.current_phase,
            score: trackingResult.qualification_score,
            phase_changed: trackingResult.phase_changed,
          });
        } else {
          console.warn('Failed to update conversation state:', trackingResult.error);
        }
      } catch (trackingError) {
        console.error('Error updating conversation tracking:', trackingError);
        // Don't throw - tracking failure shouldn't break response generation
      }
    }

    return bestResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
};

// Helper functions for conversation analysis
const extractPhaseInfo = (messages: AIMessage[], currentPhase: number): PhaseInfo => {
  const phaseInfo: PhaseInfo = {};

  // Extract information based on current phase
  const conversationText = messages
    .map(m => m.content)
    .join(' ')
    .toLowerCase();

  switch (currentPhase) {
    case 1: // Situación Actual
      if (conversationText.includes('negocio') || conversationText.includes('empresa')) {
        phaseInfo.business_type = 'mentioned';
      }
      if (conversationText.includes('años') || conversationText.includes('tiempo')) {
        phaseInfo.business_age = 'mentioned';
      }
      break;

    case 2: {
      // Dolor
      const painKeywords = ['problema', 'dificultad', 'dolor', 'frustra', 'difícil'];
      if (painKeywords.some(keyword => conversationText.includes(keyword))) {
        phaseInfo.pain_identified = true;
      }
      break;
    }

    case 3: {
      // Situación Deseada
      const goalKeywords = ['quiero', 'objetivo', 'meta', 'lograr', 'ideal'];
      if (goalKeywords.some(keyword => conversationText.includes(keyword))) {
        phaseInfo.goals_defined = true;
      }
      break;
    }

    case 4: {
      // Obstáculo
      const obstacleKeywords = ['obstáculo', 'impedimento', 'barrera', 'pero', 'however'];
      if (obstacleKeywords.some(keyword => conversationText.includes(keyword))) {
        phaseInfo.obstacles_identified = true;
      }
      break;
    }

    case 5: {
      // Oferta
      const offerKeywords = ['llamada', 'reunión', 'cita', 'agenda', 'cuando'];
      if (offerKeywords.some(keyword => conversationText.includes(keyword))) {
        phaseInfo.offer_discussed = true;
      }
      break;
    }
  }

  return phaseInfo;
};

const extractIntent = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('sí') || lowerMessage.includes('si') || lowerMessage.includes('yes')) {
    return 'positive_response';
  }

  if (lowerMessage.includes('no') || lowerMessage.includes('not')) {
    return 'negative_response';
  }

  if (
    lowerMessage.includes('?') ||
    lowerMessage.includes('cuándo') ||
    lowerMessage.includes('cómo')
  ) {
    return 'question';
  }

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

// Quick action functions with hierarchical prompts
export const generateQuickActions = {
  summarizeConversation: async (messages: AIMessage[], model: GeminiModel): Promise<string> => {
    try {
      const geminiModel = genAI.getGenerativeModel({ model });

      // Get specialized prompt for summarization
      const components = await promptManager.buildPromptComponents('summarize');

      let prompt: string;
      if (components.basePrompt) {
        prompt = `${components.basePrompt.content}

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}`;
      } else {
        // Fallback to original prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Analiza esta conversación entre el setter y el lead, y proporciona un resumen ejecutivo para el setter:

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}

Proporciona:
1. **Información clave del lead**: Nombre, negocio, situación actual
2. **Puntos de dolor identificados**: Problemas y frustraciones expresadas
3. **Objetivos del lead**: Lo que quiere lograr
4. **Fase actual**: En qué fase de las 5 se encuentra
5. **Próximos pasos recomendados**: Qué debería hacer el setter ahora

ESTILO DE ESCRITURA NATURAL:
- Olvida las formalidades - habla como hablarías con un colega
- PROHIBIDO usar ¿ o ¡ - nadie los usa en mensajes reales
- Evita las "comillas" innecesarias
- Si el lead es joven, puedes usar "bro", "tio", "colega"
- Mensajes cortos y al punto - máximo 3 líneas
- Adapta tu nivel de informalidad al del lead

Recuerda: Te diriges al setter para ayudarle, NO al lead.`;
      }

      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error in summarizeConversation:', error);
      throw error;
    }
  },

  analyzeSalesPhase: async (messages: AIMessage[], model: GeminiModel): Promise<string> => {
    try {
      const geminiModel = genAI.getGenerativeModel({ model });

      // Get specialized prompt for phase analysis
      const components = await promptManager.buildPromptComponents('analyze_phase');

      let prompt: string;
      if (components.basePrompt) {
        prompt = `${components.basePrompt.content}

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}`;
      } else {
        // Fallback to original prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Como asistente del setter, analiza el progreso de esta conversación:

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}

Proporciona un análisis detallado:

📊 **FASE ACTUAL**: [1-5 y nombre de la fase]

✅ **FASES COMPLETADAS**:
- Fase 1 (Situación Actual): [Qué información obtuviste]
- Fase 2 (Dolor): [Problemas identificados]
- Fase 3 (Situación Deseada): [Objetivos del lead]
- Fase 4 (Obstáculo): [Barreras identificadas]
- Fase 5 (Oferta): [Si se presentó la llamada]

**LO QUE FALTA**:
- [Lista de información pendiente por obtener]

💡 **RECOMENDACIÓN**:
[Qué deberías hacer ahora como setter para avanzar]

ESTILO DE ESCRITURA COLEGA:
- Habla como le hablarías a un compañero de curro
- NUNCA uses ¿ o ¡ - son de bot
- Directo al grano, sin rollos
- Puedes usar expresiones como "mira", "la verdad", "te digo"
- Si ves que puedes ayudar, dilo claro: "creo que aquí te puedo echar una mano"

Recuerda: Este análisis es para TI como setter, para ayudarte a entender el progreso.`;
      }

      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error in analyzeSalesPhase:', error);
      throw error;
    }
  },

  suggestMessages: async (
    messages: AIMessage[],
    model: GeminiModel,
    currentPhase?: number,
    leadType?: string,
  ): Promise<string> => {
    try {
      const geminiModel = genAI.getGenerativeModel({ model });

      // Get specialized prompt and templates for suggestions
      const components = await promptManager.buildPromptComponents(
        'suggest_message',
        currentPhase,
        leadType,
      );

      let prompt: string;
      if (components.basePrompt) {
        // Build prompt with script templates if available
        const scriptSection =
          components.scriptTemplates.length > 0
            ? `\n\n# TEMPLATES DEL SCRIPT PARA ESTA FASE\n${promptManager.formatScriptTemplates(components.scriptTemplates)}`
            : '';

        const examplesSection =
          components.fewShotExamples.length > 0
            ? `\n\n# EJEMPLOS DE MENSAJES EXITOSOS\n${promptManager.formatFewShotExamples(components.fewShotExamples)}`
            : '';

        prompt = `${components.basePrompt.content}${scriptSection}${examplesSection}

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}`;
      } else {
        // Fallback to original prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Como asistente, ayuda al setter sugiriendo mensajes para continuar esta conversación:

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}

**ANÁLISIS RÁPIDO**:
- **Fase actual**: [Especifica en qué fase están]
- **Último mensaje del lead**: [Cita el mensaje]
- **Qué necesitas obtener**: [Objetivo específico para avanzar]

---

**SUGERENCIAS DE RESPUESTA**:

📝 **Opción 1 (Script estricto)**:
\`\`\`
[Mensaje basado exactamente en el script de Quantum]
\`\`\`

📝 **Opción 2 (Script adaptado)**:
\`\`\`
[Mensaje basado en el script pero adaptado al contexto]
\`\`\`

📝 **Opción 3 (Creativa)**:
\`\`\`
[Mensaje más libre pero alineado con el objetivo]
\`\`\`

**POR QUÉ ESTAS OPCIONES**:
- **Opción 1**: [Estrategia de esta opción]
- **Opción 2**: [Estrategia de esta opción]
- **Opción 3**: [Estrategia de esta opción]

ESTILO PARA LAS SUGERENCIAS:
- Los mensajes deben sonar 100% humanos y casuales
- CERO signos ¿ o ¡ - prohibidos totalmente
- Lenguaje directo: "mira", "oye", "te cuento"
- Si es apropiado: "bro", "jefe", "tio"
- Frases cortas, máximo 2-3 líneas
- Evita formalismos tipo "Me complace informarle" - eso es de bot
- Cada opción debe poder copiarse y enviarse tal cual

Recuerda: Estas son sugerencias para TI como setter. Copia y pega la que prefieras.`;
      }

      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error in suggestMessages:', error);
      throw error;
    }
  },
};
