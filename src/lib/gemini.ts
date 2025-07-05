import { GoogleGenerativeAI } from '@google/generative-ai';
import { APPOINTMENT_SETTING_CONTEXT } from './appointment-setting-context';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Available models
export const GEMINI_MODELS = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro'
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
}

export const generateAIResponse = async ({
  messages,
  model,
  conversationContext
}: GenerateResponseOptions): Promise<string> => {
  try {
    const geminiModel = genAI.getGenerativeModel({ model });
    
    // Build the full prompt
    const fullPrompt = `
Eres un asistente IA general, capaz de ayudar con cualquier pregunta o tarea.

Tu especialidad es el appointment setting, y tienes conocimiento experto sobre:
${APPOINTMENT_SETTING_CONTEXT}

${conversationContext ? `\nContexto de la conversación actual del usuario:\n${conversationContext}\n` : ''}

Historial del chat:
${messages.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`).join('\n')}

INSTRUCCIONES IMPORTANTES:
- Eres un asistente general que puede ayudar con CUALQUIER tema o pregunta
- Cuando el usuario salude (hola, buenos días, etc), responde amigablemente y pregunta en qué puedes ayudar
- NO asumas que el usuario quiere hablar de appointment setting a menos que lo mencione
- Si la pregunta ES sobre appointment setting, entonces usa tu conocimiento especializado
- Si el usuario comparte una conversación con un lead, analízala como su asistente
- Usa un tono amigable, profesional y conversacional
- Recuerda: el usuario es una PERSONA real hablando contigo, NO un lead`;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
};

// Quick action functions
export const generateQuickActions = {
  summarizeConversation: async (messages: AIMessage[], model: GeminiModel): Promise<string> => {
    const prompt = `${APPOINTMENT_SETTING_CONTEXT}

Analiza esta conversación entre el setter y el lead, y proporciona un resumen ejecutivo para el setter:

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}

Proporciona:
1. **Información clave del lead**: Nombre, negocio, situación actual
2. **Puntos de dolor identificados**: Problemas y frustraciones expresadas
3. **Objetivos del lead**: Lo que quiere lograr
4. **Fase actual**: En qué fase de las 5 se encuentra
5. **Próximos pasos recomendados**: Qué debería hacer el setter ahora

Recuerda: Te diriges al setter para ayudarle, NO al lead.`;

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  },

  analyzeSalesPhase: async (messages: AIMessage[], model: GeminiModel): Promise<string> => {
    const prompt = `${APPOINTMENT_SETTING_CONTEXT}

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

❗ **LO QUE FALTA**:
- [Lista de información pendiente por obtener]

💡 **RECOMENDACIÓN**:
[Qué deberías hacer ahora como setter para avanzar]

Recuerda: Este análisis es para TI como setter, para ayudarte a entender el progreso.`;

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  },

  suggestMessages: async (messages: AIMessage[], model: GeminiModel): Promise<string> => {
    const prompt = `${APPOINTMENT_SETTING_CONTEXT}

Como asistente, ayuda al setter sugiriendo mensajes para continuar esta conversación:

Conversación entre setter y lead:
${messages.map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`).join('\n')}

**ANÁLISIS RÁPIDO**:
- **Fase actual**: [Especifica en qué fase están]
- **Último mensaje del lead**: "[Cita el mensaje]"
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

Recuerda: Estas son sugerencias para TI como setter. Copia y pega la que prefieras.`;

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  }
};