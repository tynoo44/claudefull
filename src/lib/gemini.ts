import { GoogleGenerativeAI } from '@google/generative-ai';
import { APPOINTMENT_SETTING_CONTEXT } from './appointment-setting-context';
import { promptManager, PromptComponents } from './prompt-manager';
import { responseValidator, ValidationConfig } from './response-validator';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Available models
export const GEMINI_MODELS = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
} as const;

export type GeminiModel = keyof typeof GEMINI_MODELS;

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GenerateResponseOptions {
  messages: AIMessage[];
  model: GeminiModel;
  conversationContext?: string;
  currentPhase?: number;
  leadType?: string;
}

// Build hierarchical prompt from components
const buildHierarchicalPrompt = (
  components: PromptComponents,
  messages: AIMessage[]
): string => {
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
    parts.push(`# SCRIPTS PARA FASE ${components.currentPhase}\n${promptManager.formatScriptTemplates(components.scriptTemplates)}`);
  }

  // 3. Few-shot examples
  if (components.fewShotExamples.length > 0) {
    parts.push(`# EJEMPLOS DE EXCELENCIA\n${promptManager.formatFewShotExamples(components.fewShotExamples)}`);
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
    parts.push(`# FORMATO DE RESPUESTA
- Mensajes concisos y naturales
- Máximo 3 párrafos por mensaje
- Un emoji profesional máximo por mensaje
- Preguntas abiertas que inviten a compartir
- NO uses signos de interrogación al inicio
- NO uses signos de exclamación al inicio
- Escribe como una persona real, no un robot`);
  }

  return parts.join('\n\n');
};

export const generateAIResponse = async ({
  messages,
  model,
  conversationContext,
  currentPhase,
  leadType,
}: GenerateResponseOptions): Promise<string> => {
  try {
    const geminiModel = genAI.getGenerativeModel({ model });

    // Build prompt components from database
    const components = await promptManager.buildPromptComponents(
      'main',
      currentPhase,
      leadType,
      conversationContext
    );

    // Build the hierarchical prompt
    const fullPrompt = buildHierarchicalPrompt(components, messages);

    // Validation configuration
    const validationConfig: ValidationConfig = {
      minScore: 0.7,
      keyPhraseWeight: 0.8,
      strictMode: false,
      regenerateThreshold: 0.5,
      maxRegenerationAttempts: 2
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
          validationConfig
        );
        
        console.log(`Validation attempt ${attempts + 1}:`, {
          phase: currentPhase,
          score: validation.score,
          suggestions: validation.suggestions
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
        if (validation.score < validationConfig.regenerateThreshold && 
            attempts < validationConfig.maxRegenerationAttempts - 1) {
          // Add validation hints to the prompt
          const hintsPrompt = fullPrompt + `\n\n# MEJORAS REQUERIDAS:\n${validation.suggestions.join('\n')}`;
          
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
            validationConfig
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
    return bestResponse;
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
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

ESTILO DE ESCRITURA:
- Habla de forma natural y cercana
- NO uses signos de interrogación ni exclamación al inicio
- Sé directo y conciso
- Escribe como una persona real, no un robot
- Evita párrafos largos sin valor

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

ESTILO DE ESCRITURA:
- Habla de forma natural como un compañero de trabajo
- NO uses signos de interrogación ni exclamación al inicio
- Sé directo, no des rodeos
- Escribe como una persona real ayudando a otra
- Mantén el mensaje conciso y útil

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
    leadType?: string
  ): Promise<string> => {
    try {
      const geminiModel = genAI.getGenerativeModel({ model });
      
      // Get specialized prompt and templates for suggestions
      const components = await promptManager.buildPromptComponents(
        'suggest_message',
        currentPhase,
        leadType
      );
      
      let prompt: string;
      if (components.basePrompt) {
        // Build prompt with script templates if available
        const scriptSection = components.scriptTemplates.length > 0
          ? `\n\n# TEMPLATES DEL SCRIPT PARA ESTA FASE\n${promptManager.formatScriptTemplates(components.scriptTemplates)}`
          : '';
          
        const examplesSection = components.fewShotExamples.length > 0
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

ESTILO DE ESCRITURA:
- Escribe de forma natural y fluida
- NO uses signos de interrogación ni exclamación al inicio
- Los mensajes sugeridos deben sonar humanos, no robóticos
- Sé conciso pero cálido
- Evita frases hechas o demasiado formales
- Cada opción debe ser práctica y fácil de copiar

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