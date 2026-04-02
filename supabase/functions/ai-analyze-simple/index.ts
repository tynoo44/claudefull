// AI Conversation Analysis Edge Function - OpenAI GPT version

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendToN8N, N8N_EVENTS, createN8NPayload } from '../shared/n8n-webhook.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface AnalyzeConversationRequest {
  conversationId: string;
  leadId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>;
  forceReanalyze?: boolean;
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

    const request: AnalyzeConversationRequest = await req.json();
    if (!request.conversationId || !request.leadId || !request.messages) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for recent cached analysis
    if (!request.forceReanalyze) {
      const { data: existingAnalysis } = await supabase
        .from('conversation_analysis')
        .select('*')
        .eq('conversation_id', request.conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingAnalysis?.created_at) {
        const analysisAge = Date.now() - new Date(existingAnalysis.created_at).getTime();
        if (analysisAge < 30 * 60 * 1000) {
          return new Response(
            JSON.stringify({
              success: true,
              analysis: {
                currentPhase: existingAnalysis.analysis_data?.current_phase || 1,
                qualificationScore: existingAnalysis.analysis_data?.qualification_score || 0,
                leadProfile: existingAnalysis.analysis_data?.lead_profile || {},
                summary: existingAnalysis.analysis_data?.summary || '',
                nextSteps: existingAnalysis.action_threads || [],
                redFlags: existingAnalysis.warnings || [],
              },
              isNewAnalysis: false,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }
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

    const { data: analysisPrompt } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_type', 'conversation_analysis')
      .eq('active', true)
      .single();

    let leadContext = '';
    if (request.leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', request.leadId)
        .single();
      if (lead) {
        leadContext = `\nDATOS DEL LEAD:\n- Instagram: @${lead.instagram_username}\n- Procedencia: ${lead.procedence || 'No especificada'}\n- Estado: ${lead.status}`;
      }
    }

    const messagesBySender = request.messages.reduce(
      (acc, msg) => {
        acc[msg.role] = (acc[msg.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const engagementRate = messagesBySender.user / (request.messages.length || 1);

    const analysisInstructions =
      analysisPrompt?.content ||
      'Analiza esta conversacion de ventas para extraer insights accionables.';

    const systemPrompt = `${analysisInstructions}

FASES DEL PROCESO:
1. Contacto inicial (0-20%): Generar curiosidad, primer contacto
2. Calificacion (21-40%): Identificar necesidad, validar fit
3. Presentacion (41-60%): Mostrar valor, casos de exito
4. Objeciones (61-80%): Resolver dudas, crear urgencia
5. Cierre (81-100%): Agendar llamada, siguiente paso

SCORING REALISTA:
- 0.0-0.2: Sin interes, respuestas cortas o negativas
- 0.3-0.4: Interes inicial, hace preguntas basicas
- 0.5-0.6: Interes moderado, comparte informacion del negocio
- 0.7-0.8: Alto interes, pregunta por precios/detalles
- 0.9-1.0: Listo para cerrar, solicita siguiente paso

Responde SOLO con JSON valido, sin markdown ni texto adicional.`;

    const userPrompt = `CONTEXTO:${leadContext}
- Total mensajes: ${request.messages.length}
- Mensajes del lead: ${messagesBySender.user || 0}
- Mensajes del setter: ${messagesBySender.assistant || 0}
- Tasa de respuesta: ${(engagementRate * 100).toFixed(0)}%

CONVERSACION:
${conversationText}

GENERA ANALISIS en JSON:
{
  "currentPhase": number (1-5),
  "qualificationScore": number (0-1, conservador),
  "leadProfile": {
    "type": "emprendedor/negocio_local/empresa/agencia/desconocido",
    "characteristics": ["rasgos observados"],
    "businessType": "tipo de negocio",
    "sophisticationLevel": "bajo/medio/alto",
    "mainObjections": ["objeciones"],
    "buyingSignals": ["indicadores positivos"],
    "painPoints": ["problemas mencionados"],
    "communicationStyle": "formal/casual/tecnico/emocional"
  },
  "summary": "Resumen ejecutivo",
  "nextSteps": ["acciones especificas"],
  "redFlags": ["alertas"],
  "opportunities": ["oportunidades"],
  "keyInsights": ["insights clave"],
  "recommendedApproach": "estrategia recomendada"
}`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    let analysis;
    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json();
      try {
        const responseText = openaiData.choices[0].message.content;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing OpenAI response:', e);
      }
    } else {
      const errorBody = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorBody);
    }

    // Fallback analysis
    if (!analysis) {
      const messageCount = request.messages.length;
      const hasQuestions = conversationText.includes('?');
      const hasBusinessMention = conversationText
        .toLowerCase()
        .match(/negocio|empresa|ventas|clientes/);

      analysis = {
        currentPhase: messageCount > 10 ? 2 : 1,
        qualificationScore: hasBusinessMention ? 0.4 : 0.2,
        leadProfile: {
          type: 'desconocido',
          characteristics: ['Conversacion en desarrollo', 'Perfil por determinar'],
          businessType: 'No identificado aun',
          sophisticationLevel: 'medio',
          mainObjections: [],
          buyingSignals: hasQuestions ? ['Hace preguntas'] : [],
          painPoints: [],
          communicationStyle: 'casual',
        },
        summary: `Conversacion con ${messageCount} mensajes. ${hasBusinessMention ? 'Menciona temas de negocio.' : 'Aun explorando interes.'}`,
        nextSteps: [
          'Identificar el tipo de negocio del lead',
          'Explorar necesidades especificas',
          'Generar curiosidad sobre la solucion',
        ],
        redFlags: messageCount < 3 ? ['Conversacion muy corta para evaluar'] : [],
        opportunities: ['Profundizar en el negocio del lead'],
        keyInsights: ['Analisis preliminar - se necesita mas interaccion'],
        recommendedApproach: 'Hacer preguntas abiertas sobre su negocio y desafios actuales',
      };
    }

    // Save analysis
    const userMessages = request.messages.filter(m => m.role === 'user').length;
    const totalMessages = request.messages.length;
    const savedEngRate = totalMessages > 0 ? userMessages / totalMessages : 0;

    const { error: saveError } = await supabase.from('conversation_analysis').insert({
      conversation_id: request.conversationId,
      lead_id: request.leadId,
      analysis_data: {
        current_phase: analysis.currentPhase,
        qualification_score: analysis.qualificationScore,
        lead_profile: analysis.leadProfile,
        summary: analysis.summary,
        opportunities: analysis.opportunities,
        key_insights: analysis.keyInsights,
        recommended_approach: analysis.recommendedApproach,
      },
      sentiment_scores: {
        positive: analysis.qualificationScore,
        neutral: 1 - analysis.qualificationScore,
        negative: 0,
      },
      phase_progress: {
        [analysis.currentPhase]: 100,
        overall: (analysis.currentPhase / 5) * 100,
      },
      key_insights: analysis.keyInsights || [],
      warnings: analysis.redFlags || [],
      action_threads: analysis.nextSteps || [],
      urgency_score: Math.round(analysis.qualificationScore * 10),
      capacity_score: 5,
      engagement_score: Math.round(savedEngRate * 10),
      is_current: true,
      last_message_analyzed_at: new Date().toISOString(),
    });

    if (saveError) {
      console.error('Error saving analysis:', saveError);
    }

    await sendToN8N(
      createN8NPayload(
        N8N_EVENTS.CONVERSATION_ANALYZED,
        {
          conversationId: request.conversationId,
          leadId: request.leadId,
          analysis,
          messageCount: request.messages.length,
          isNewAnalysis: true,
          scores: {
            qualification: analysis.qualificationScore,
            urgency: Math.round(analysis.qualificationScore * 10),
            engagement: Math.round(savedEngRate * 10),
          },
        },
        'ai-analyze-simple',
        { userId: user.id, conversationId: request.conversationId, leadId: request.leadId },
      ),
    );

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          currentPhase: analysis.currentPhase,
          qualificationScore: analysis.qualificationScore,
          leadProfile: analysis.leadProfile,
          summary: analysis.summary,
          nextSteps: analysis.nextSteps || [],
          redFlags: analysis.redFlags || [],
          opportunities: analysis.opportunities || [],
          keyInsights: analysis.keyInsights || [],
          recommendedApproach: analysis.recommendedApproach || '',
        },
        isNewAnalysis: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in ai-analyze-simple function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
