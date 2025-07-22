// Prompt building functionality for Gemini AI

import { APPOINTMENT_SETTING_CONTEXT } from '../appointment-setting-context';
import { promptManager, PromptComponents } from '../prompt-manager';
import type { AIMessage } from './types';

// Build hierarchical prompt from components
export const buildHierarchicalPrompt = (
  components: PromptComponents,
  messages: AIMessage[],
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
1. UN solo mensaje corto (máximo 3 líneas)
2. PROHIBIDO usar signos de apertura ¿ o ¡
3. Habla como hablaría el lead
4. Si es joven: "bro", "tio", "pana"
5. Si es formal: lenguaje profesional pero directo
6. NUNCA suenes como un bot
7. Evita las comillas innecesarias`);
  }

  return parts.join('\n\n');
};