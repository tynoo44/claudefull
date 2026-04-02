// AI enrichment service - handles AI-powered analysis generation

import { generateAIResponse } from '../../lib/ai-service';

import { type AIModel } from '../../lib/ai-service';

const DEFAULT_MODEL: AIModel = 'gpt-5.4';
import { generatePhaseDetails, generatePhaseProgress } from './phaseAnalyzer';
import { ConversationMessage } from './types';

interface EnrichmentResult {
  analysis_data: {
    summary: string;
    current_phase: number;
    phase_details: any;
    sentiment_timeline: any[];
    overall_sentiment: string;
    key_moments: any[];
  };
  phase_progress: any;
  key_insights: string[];
  warnings: string[];
  action_threads: string[];
}

export async function generateEnrichedAnalysis(
  messages: ConversationMessage[],
  conversation: any,
  conversationMemory: any,
  intent: any,
  leadProfile: any,
): Promise<EnrichmentResult> {
  console.log('generateEnrichedAnalysis called with:', {
    messagesCount: messages?.length,
    conversationId: conversation?.id,
    hasMemory: !!conversationMemory,
    intent: intent?.primaryIntent,
    leadProfile: leadProfile?.type,
  });

  // Validate conversation memory structure
  if (!conversationMemory) {
    console.error('No conversation memory available for enriched analysis');
    // Return a default structure
    return generateBasicAnalysis(messages, conversation, conversationMemory);
  }

  const prompt = `Analiza esta conversación de ventas y responde ÚNICAMENTE con un objeto JSON válido.

CONVERSACIÓN:
${messages.map(m => `${m.sender_type}: ${m.text}`).join('\n')}

CONTEXTO:
- Fase actual: ${conversation.current_phase}
- Score: ${conversationMemory.qualification_score?.score || 0}
- Intención: ${intent?.primaryIntent || 'general'}
- Perfil: ${leadProfile?.type || 'unknown'}

Responde SOLO con este JSON (sin texto adicional antes o después):

{
  "analysis_data": {
    "summary": "Resumen ejecutivo de la conversación en 1-2 líneas",
    "current_phase": ${conversation.current_phase},
    "phase_details": {
      "1": {"name": "Situación Actual", "status": "completed", "progress": 100, "information_gathered": ["info1"], "next_steps": ["step1"]},
      "2": {"name": "Dolor", "status": "in_progress", "progress": 50, "information_gathered": ["info2"], "next_steps": ["step2"]},
      "3": {"name": "Situación Deseada", "status": "not_started", "progress": 0, "information_gathered": [], "next_steps": []},
      "4": {"name": "Obstáculo", "status": "not_started", "progress": 0, "information_gathered": [], "next_steps": []},
      "5": {"name": "Oferta", "status": "not_started", "progress": 0, "information_gathered": [], "next_steps": []}
    },
    "sentiment_timeline": [],
    "overall_sentiment": "neutral",
    "key_moments": []
  },
  "phase_progress": {
    "1": {"completed": true, "progress": 100, "key_info": ["información obtenida"], "missing_info": []},
    "2": {"completed": false, "progress": 50, "key_info": ["algo detectado"], "missing_info": ["falta esto"]},
    "3": {"completed": false, "progress": 0, "key_info": [], "missing_info": ["objetivos del lead"]},
    "4": {"completed": false, "progress": 0, "key_info": [], "missing_info": ["obstáculos"]},
    "5": {"completed": false, "progress": 0, "key_info": [], "missing_info": ["presentar oferta"]}
  },
  "key_insights": [
    "Insight específico 1 extraído de la conversación real",
    "Dolor concreto mencionado por el lead",
    "Señal de compra detectada"
  ],
  "warnings": [
    "Advertencia específica solo si es relevante"
  ],
  "action_threads": [
    "Tema específico para profundizar",
    "Pregunta pendiente de responder"
  ]
}`;

  try {
    console.log('About to call generateAIResponse with DEFAULT_MODEL:', DEFAULT_MODEL);
    console.log('Prompt length:', prompt.length);

    const response = await generateAIResponse({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
    });

    console.log(
      'generateAIResponse returned:',
      response ? `response received (${response.length} chars)` : 'no response',
    );
    console.log('Raw response preview:', response?.substring(0, 200) + '...');

    // Try to extract JSON from response if it's not pure JSON
    let jsonContent = response;

    // Look for JSON pattern in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
      console.log('Extracted JSON from response, length:', jsonContent.length);
    }

    // Parsear la respuesta JSON
    const parsed = JSON.parse(jsonContent);
    console.log('Successfully parsed AI response');
    return parsed;
  } catch (error) {
    console.error('Error in generateEnrichedAnalysis:', error);
    // Fallback a análisis básico si falla la IA
    return generateBasicAnalysis(messages, conversation, conversationMemory);
  }
}

export function generateBasicAnalysis(
  messages: any[],
  conversation: any,
  _conversationMemory: any,
): EnrichmentResult {
  return {
    analysis_data: {
      summary: `Conversación en fase ${conversation.current_phase}`,
      current_phase: conversation.current_phase,
      phase_details: generatePhaseDetails(messages, conversation.current_phase),
      sentiment_timeline: [],
      overall_sentiment: 'neutral',
      key_moments: [],
    },
    phase_progress: generatePhaseProgress(messages, conversation.current_phase),
    key_insights: ['Análisis básico generado como fallback'],
    warnings: ['Análisis AI no disponible'],
    action_threads: ['Revisar manualmente la conversación'],
  };
}
