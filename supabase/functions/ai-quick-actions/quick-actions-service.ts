// Quick Actions Service for Edge Functions
// Migrated from src/lib/gemini/quick-actions.ts

import { generateContent } from '../shared/gemini-client.ts';
import { EdgePromptManager } from '../shared/database-client.ts';
import { AIMessage, QuickActionResponse } from '../shared/types.ts';

const APPOINTMENT_SETTING_CONTEXT = `Eres un asistente AI experto en appointment setting B2B.

METODOLOGÍA QUANTUM CREATORS - 5 FASES:
1. SITUACIÓN ACTUAL - Entender dónde está el lead
2. DOLOR - Identificar problemas y frustraciones  
3. SITUACIÓN DESEADA - Descubrir objetivos
4. OBSTÁCULO - Encontrar qué les impide llegar
5. OFERTA - Presentar la llamada como solución

CONTEXTO: Ayudas a setters profesionales a conseguir citas con leads calificados usando conversación natural e informal.`;

export class QuickActionsService {
  private promptManager: EdgePromptManager;

  constructor() {
    this.promptManager = new EdgePromptManager();
  }

  async summarizeConversation(messages: AIMessage[], model: string): Promise<QuickActionResponse> {
    try {
      // Get specialized prompt for summarization
      const components = await this.promptManager.buildPromptComponents('summarize');

      let prompt: string;
      if (components.basePrompt) {
        prompt = `${components.basePrompt.content}

Conversación entre setter y lead:
${this.formatConversation(messages)}`;
      } else {
        // Fallback prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Analiza esta conversación entre el setter y el lead, y proporciona un resumen ejecutivo para el setter:

Conversación entre setter y lead:
${this.formatConversation(messages)}

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

      const result = await generateContent({ model }, prompt);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('Error in summarizeConversation:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async analyzeSalesPhase(messages: AIMessage[], model: string): Promise<QuickActionResponse> {
    try {
      // Get specialized prompt for phase analysis
      const components = await this.promptManager.buildPromptComponents('analyze_phase');

      let prompt: string;
      if (components.basePrompt) {
        prompt = `${components.basePrompt.content}

Conversación entre setter y lead:
${this.formatConversation(messages)}`;
      } else {
        // Fallback prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Como asistente del setter, analiza el progreso de esta conversación:

Conversación entre setter y lead:
${this.formatConversation(messages)}

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

      const result = await generateContent({ model }, prompt);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('Error in analyzeSalesPhase:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async suggestMessages(
    messages: AIMessage[],
    model: string,
    currentPhase?: number,
    leadType?: string
  ): Promise<QuickActionResponse> {
    try {
      // Get specialized prompt and templates for suggestions
      const components = await this.promptManager.buildPromptComponents(
        'suggest_message',
        currentPhase,
        leadType
      );

      let prompt: string;
      if (components.basePrompt) {
        // Build prompt with script templates if available
        const scriptSection = components.scriptTemplates.length > 0
          ? `\n\n# TEMPLATES DEL SCRIPT PARA ESTA FASE\n${this.formatScriptTemplates(components.scriptTemplates)}`
          : '';

        const examplesSection = components.fewShotExamples.length > 0
          ? `\n\n# EJEMPLOS DE MENSAJES EXITOSOS\n${this.formatFewShotExamples(components.fewShotExamples)}`
          : '';

        prompt = `${components.basePrompt.content}

Conversación entre setter y lead:
${this.formatConversation(messages)}
${scriptSection}${examplesSection}`;
      } else {
        // Fallback prompt
        prompt = `${APPOINTMENT_SETTING_CONTEXT}

Como asistente del setter, sugiere 3 mensajes diferentes para continuar esta conversación:

Conversación entre setter y lead:
${this.formatConversation(messages)}

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

      const result = await generateContent({ model }, prompt);
      
      // Parse suggestions from the result
      const suggestions = this.parseSuggestions(result);
      
      return {
        success: true,
        result,
        suggestions,
      };
    } catch (error) {
      console.error('Error in suggestMessages:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format conversation for AI prompts
   */
  private formatConversation(messages: AIMessage[]): string {
    return messages
      .map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Format script templates for prompts
   */
  private formatScriptTemplates(templates: any[]): string {
    return templates
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map(template => `- ${template.content}`)
      .join('\n');
  }

  /**
   * Format few-shot examples for prompts
   */
  private formatFewShotExamples(examples: any[]): string {
    return examples
      .map(example => `Lead: ${example.example_input}\nSetter: ${example.example_output}`)
      .join('\n\n');
  }

  /**
   * Parse message suggestions from AI response
   */
  private parseSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    try {
      // Try to extract structured suggestions
      const optionPattern = /\*\*Opción \d+ \([^)]+\):\*\*\s*\n([^*]+)/g;
      let match;
      
      while ((match = optionPattern.exec(response)) !== null) {
        const suggestion = match[1].trim();
        if (suggestion && suggestion.length > 0) {
          suggestions.push(suggestion);
        }
      }
      
      // Fallback: split by common separators if structured parsing fails
      if (suggestions.length === 0) {
        const lines = response.split('\n').filter(line => 
          line.trim().length > 10 && 
          !line.includes('**') && 
          !line.includes('Opción')
        );
        
        lines.slice(0, 3).forEach(line => {
          const clean = line.trim();
          if (clean.length > 0) {
            suggestions.push(clean);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing suggestions:', error);
    }
    
    return suggestions.length > 0 ? suggestions : [response];
  }
}