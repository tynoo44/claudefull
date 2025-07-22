// Quick action functions for Gemini AI

import { GoogleGenerativeAI } from '@google/generative-ai';
import { APPOINTMENT_SETTING_CONTEXT } from '../appointment-setting-context';
import { promptManager } from '../prompt-manager';
import type { AIMessage, GeminiModel } from './types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

        prompt = `${components.basePrompt.content}

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}
${scriptSection}${examplesSection}`;
      } else {
        // Fallback to original prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Como asistente del setter, sugiere 3 mensajes diferentes para continuar esta conversación:

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}

Fase actual: ${currentPhase || 'No definida'}
Tipo de lead: ${leadType || 'general'}

Genera 3 opciones diferentes:
1. **Directa**: Ve al grano, pregunta o afirma algo concreto
2. **Empática**: Muestra que entiendes su situación
3. **Curiosa**: Haz una pregunta que genere reflexión

REGLAS DE ESCRITURA OBLIGATORIAS:
- MAX 2-3 líneas por mensaje
- NUNCA uses ¿ o ¡ al inicio
- Adapta el tono al del lead (formal/informal)
- Si es joven: "bro", "tio", "man" están OK
- Si es mayor: mantén respeto pero sin ser robot
- Evita las comillas innecesarias
- Escribe como escribirías en WhatsApp/Instagram

Formato de salida:
**Opción 1 (Directa):**
[mensaje aquí]

**Opción 2 (Empática):**
[mensaje aquí]

**Opción 3 (Curiosa):**
[mensaje aquí]`;
      }

      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error in suggestMessages:', error);
      throw error;
    }
  },
};