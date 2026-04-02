// AI Response Generation Edge Function - OpenAI GPT version
// Generates AI responses for chat conversations

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendToN8N, N8N_EVENTS, createN8NPayload } from '../shared/n8n-webhook.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface GenerateResponseRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model: string;
  conversationContext?: any;
  currentPhase?: number;
  leadType?: string;
  conversationId?: string;
  leadId?: string;
  enableTracking?: boolean;
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

    const request: GenerateResponseRequest = await req.json();
    if (!request.messages || !request.model) {
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

    const phase = request.currentPhase || 1;
    const phaseDescriptions: Record<number, string> = {
      1: 'Contacto inicial - Genera curiosidad',
      2: 'Calificacion - Identifica necesidades',
      3: 'Presentacion - Muestra valor',
      4: 'Manejo de objeciones - Resuelve dudas',
      5: 'Cierre - Solicita accion',
    };

    // Get prompts and templates from database
    const { data: activePrompt } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_type', 'setter_response')
      .eq('active', true)
      .single();

    const { data: scriptTemplate } = await supabase
      .from('script_templates')
      .select('*')
      .eq('phase', phase)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    const { data: fewShotExamples } = await supabase
      .from('few_shot_examples')
      .select('*')
      .eq('phase', phase)
      .limit(3);

    let systemPrompt = activePrompt?.content || 'Eres un setter profesional de Quantum Creators.';

    if (scriptTemplate) {
      systemPrompt += `\n\nTEMPLATE PARA FASE ${phase}:\n${scriptTemplate.content}`;
    }

    if (fewShotExamples && fewShotExamples.length > 0) {
      systemPrompt += '\n\nEJEMPLOS DE RESPUESTAS EXITOSAS:\n';
      fewShotExamples.forEach((example: any, idx: number) => {
        systemPrompt += `\nEjemplo ${idx + 1}:\nLead: ${example.lead_message}\nSetter: ${example.setter_response}\n`;
      });
    }

    let leadAnalysis = '';
    if (request.conversationId && request.leadId) {
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('conversation_state, lead_profile')
        .eq('id', request.conversationId)
        .single();

      if (conversationData?.lead_profile) {
        leadAnalysis = `\nPERFIL DEL LEAD:\n${JSON.stringify(conversationData.lead_profile, null, 2)}`;
      }
    }

    systemPrompt += `\n\nREGLAS CRITICAS:
1. Responde en 2-3 lineas maximo
2. Habla como una persona real, no un bot
3. Adapta tu tono al estilo del lead
4. NO uses signos ¿ o ¡ al inicio
5. Termina con pregunta abierta o CTA suave
6. Se especifico y relevante al contexto`;

    const userPrompt = `CONTEXTO ACTUAL:
- Fase: ${phase} - ${phaseDescriptions[phase]}
- Mensajes intercambiados: ${request.messages.length}
${leadAnalysis}

CONVERSACION:
${conversationText}

Tu respuesta natural y humana:`;

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
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorBody);
      let errorMsg = `OpenAI ${openaiResponse.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.error?.message || parsed.error?.code || errorMsg;
      } catch {
        /* use default */
      }
      return new Response(JSON.stringify({ success: false, error: errorMsg }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices[0].message.content.trim();

    // Intent detection
    const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
    let detectedIntent = 'neutral';
    let emotionalTone = 'neutral';
    let buyingSignals = 0;

    if (lastUserMessage) {
      const content = lastUserMessage.content.toLowerCase();
      if (content.match(/\b(precio|cuesta|costo|pagar|vale|cobr|tarifa|inversi)\b/)) {
        detectedIntent = 'price_inquiry';
        buyingSignals += 3;
      } else if (content.match(/\b(interesa|quiero|necesito|busco|quiero saber|me gusta)\b/)) {
        detectedIntent = 'interest';
        buyingSignals += 5;
      } else if (content.match(/\b(no me|no gracias|paso|no puedo|no tengo tiempo|ahora no)\b/)) {
        detectedIntent = 'rejection';
        buyingSignals -= 3;
      } else if (content.match(/\b(c[uú]ando|cu[aá]ndo empezar|urgente|ya|r[aá]pido)\b/)) {
        detectedIntent = 'urgency';
        buyingSignals += 7;
      } else if (content.match(/\b(duda|pregunta|no entiendo|c[oó]mo funciona|expl[ií]ca)\b/)) {
        detectedIntent = 'question';
        buyingSignals += 2;
      }

      if (content.match(/\b(genial|incre[ií]ble|wow|excelente|perfecto)\b/)) {
        emotionalTone = 'excited';
        buyingSignals += 3;
      } else if (content.match(/\b(frustrad|cansad|hart|dif[ií]cil|problema|no puedo m[aá]s)\b/)) {
        emotionalTone = 'frustrated';
        buyingSignals += 4;
      } else if (content.match(/\b(no s[eé]|quiz[aá]|tal vez|puede ser)\b/)) {
        emotionalTone = 'uncertain';
      }
      buyingSignals = Math.max(0, Math.min(10, buyingSignals));
    }

    const response = {
      success: true,
      response: responseText,
      metadata: {
        phase,
        score: buyingSignals / 10,
        intent: detectedIntent,
        personalization: {
          tone: emotionalTone,
          style: buyingSignals > 5 ? 'enthusiastic' : 'friendly',
          buyingSignals,
        },
      },
    };

    // Update conversation state if tracking is enabled
    if (request.enableTracking && request.conversationId) {
      try {
        await supabase
          .from('conversations')
          .update({
            conversation_state: {
              last_phase: phase,
              last_intent: detectedIntent,
              last_emotion: emotionalTone,
              buying_signals: buyingSignals,
              last_ai_response: responseText,
              updated_at: new Date().toISOString(),
            },
          })
          .eq('id', request.conversationId);
      } catch (updateError) {
        console.error('Error updating conversation state:', updateError);
      }
    }

    await sendToN8N(
      createN8NPayload(
        N8N_EVENTS.AI_RESPONSE_GENERATED,
        {
          conversationId: request.conversationId,
          leadId: request.leadId,
          model: request.model,
          phase,
          response: responseText,
          metadata: response.metadata,
          messageCount: request.messages.length,
        },
        'ai-response-simple',
        { userId: user.id, conversationId: request.conversationId, leadId: request.leadId },
      ),
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-response-simple function:', error);
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
