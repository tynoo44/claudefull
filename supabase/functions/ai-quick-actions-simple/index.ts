// AI Quick Actions Edge Function - OpenAI GPT version

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendToN8N, N8N_EVENTS, createN8NPayload } from '../shared/n8n-webhook.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface QuickActionRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model: string;
  action: 'summarize' | 'analyze_phase' | 'suggest_messages';
  currentPhase?: number;
  leadType?: string;
}

interface QuickActionResponse {
  success: boolean;
  result?: string;
  suggestions?: string[];
  error?: string;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: QuickActionRequest = await req.json();
    if (!request.messages || !request.model || !request.action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversationText = request.messages
      .map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`)
      .join('\n');

    let systemPrompt = '';
    let userPrompt = '';

    switch (request.action) {
      case 'summarize':
        systemPrompt =
          'Eres un analista de conversaciones de ventas. Resume de forma concisa y accionable.';
        userPrompt = `Resume esta conversacion de ventas en 2-3 lineas, destacando lo mas importante:\n\n${conversationText}`;
        break;

      case 'analyze_phase':
        systemPrompt =
          'Eres un experto en ventas B2B. Analiza fases de conversaciones de appointment setting.';
        userPrompt = `Analiza en que fase de ventas (1-5) se encuentra esta conversacion y explica por que en 2-3 lineas:\n\n${conversationText}`;
        break;

      case 'suggest_messages': {
        const phase = request.currentPhase || 1;
        const phaseGoals: Record<number, string> = {
          1: 'generar curiosidad y obtener atencion',
          2: 'identificar dolor/necesidad y calificar',
          3: 'presentar valor y casos de exito',
          4: 'resolver objeciones y generar urgencia',
          5: 'cerrar siguiente paso concreto',
        };

        const { data: templates } = await supabase
          .from('script_templates')
          .select('*')
          .eq('phase', phase)
          .order('priority', { ascending: false })
          .limit(3);

        const { data: examples } = await supabase
          .from('few_shot_examples')
          .select('*')
          .eq('phase', phase)
          .order('created_at', { ascending: false })
          .limit(2);

        let templateContext = '';
        if (templates && templates.length > 0) {
          templateContext = '\nPATRONES EXITOSOS PARA ESTA FASE:\n';
          templates.forEach((template: any, idx: number) => {
            templateContext += `${idx + 1}. ${template.content}\n`;
          });
        }

        let exampleContext = '';
        if (examples && examples.length > 0) {
          exampleContext = '\nEJEMPLOS REALES:\n';
          examples.forEach((ex: any, idx: number) => {
            exampleContext += `Ejemplo ${idx + 1}:\nLead: "${ex.lead_message}"\nSetter: "${ex.setter_response}"\n\n`;
          });
        }

        const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
        const messageContext = lastUserMessage
          ? `\nULTIMO MENSAJE DEL LEAD: "${lastUserMessage.content}"`
          : '';

        systemPrompt = `Eres un setter experto de Quantum Creators. Genera 3 respuestas diferentes para continuar esta conversacion.

INSTRUCCIONES:
1. Cada respuesta debe ser unica y abordar diferentes angulos
2. Maximo 2-3 lineas por respuesta
3. Lenguaje natural, como hablarias por WhatsApp
4. NO uses signos ¿ o ¡ al inicio
5. Primera sugerencia: Directa al punto de dolor
6. Segunda sugerencia: Pregunta que genere reflexion
7. Tercera sugerencia: Enfoque creativo o historia corta`;

        userPrompt = `SITUACION ACTUAL:
- Fase ${phase}: ${phaseGoals[phase]}
- Tipo de lead: ${request.leadType || 'general'}
- Mensajes intercambiados: ${request.messages.length}${messageContext}
${templateContext}${exampleContext}

CONVERSACION:
${conversationText}

GENERA 3 RESPUESTAS (separa con linea en blanco):`;
        break;
      }
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-5.4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: request.action === 'suggest_messages' ? 0.9 : 0.7,
        max_tokens: request.action === 'suggest_messages' ? 800 : 500,
      }),
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      return new Response(JSON.stringify({ success: false, error: 'AI service unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices[0].message.content;

    let response: QuickActionResponse = { success: true };

    if (request.action === 'suggest_messages') {
      const suggestions = responseText
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 3)
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim());

      response.suggestions = suggestions;
      response.result = suggestions.join('\n\n');
    } else {
      response.result = responseText.trim();
    }

    if (request.action === 'suggest_messages' && response.suggestions) {
      await sendToN8N(
        createN8NPayload(
          N8N_EVENTS.AI_SUGGESTIONS_GENERATED,
          {
            action: request.action,
            suggestions: response.suggestions,
            phase: request.currentPhase,
            leadType: request.leadType,
            messageCount: request.messages.length,
          },
          'ai-quick-actions-simple',
          { userId: user.id },
        ),
      );
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-quick-actions-simple function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
