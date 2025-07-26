// AI Conversation Analysis Edge Function - Simple version
// Analyzes conversations using same pattern as send-message

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface AnalyzeConversationRequest {
  conversationId: string;
  leadId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  forceReanalyze?: boolean;
}

interface AnalyzeConversationResponse {
  success: boolean;
  analysis?: {
    currentPhase: number;
    qualificationScore: number;
    leadProfile: any;
    summary: string;
    nextSteps: string[];
    redFlags: string[];
  };
  error?: string;
  isNewAnalysis?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const request: AnalyzeConversationRequest = await req.json();

    if (!request.conversationId || !request.leadId || !request.messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if we need to analyze
    if (!request.forceReanalyze) {
      // Check if we already have a recent analysis
      const { data: existingAnalysis } = await supabase
        .from('conversation_analysis')
        .select('*')
        .eq('conversation_id', request.conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingAnalysis && existingAnalysis.created_at) {
        const analysisAge = Date.now() - new Date(existingAnalysis.created_at).getTime();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        if (analysisAge < maxAge) {
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
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }

    // Analyze conversation
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build conversation context
    const conversationText = request.messages
      .map(msg => `${msg.role === 'user' ? 'Lead' : 'Setter'}: ${msg.content}`)
      .join('\n');

    // Get analysis prompts from database
    const { data: analysisPrompt } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_type', 'conversation_analysis')
      .eq('active', true)
      .single();

    // Get lead data if available
    let leadContext = '';
    if (request.leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', request.leadId)
        .single();
      
      if (lead) {
        leadContext = `\n\n👤 DATOS DEL LEAD:\n- Instagram: @${lead.instagram_username}\n- Procedencia: ${lead.procedence || 'No especificada'}\n- Estado: ${lead.status}`;
      }
    }

    // Count messages by sender
    const messagesBySender = request.messages.reduce((acc, msg) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const engagementRate = messagesBySender.user / (request.messages.length || 1);

    const analysisInstructions = analysisPrompt?.content || `Analiza esta conversación de ventas para extraer insights accionables.`;

    // Call Gemini API for analysis
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${analysisInstructions}

🎯 CONTEXTO:${leadContext}
- Total mensajes: ${request.messages.length}
- Mensajes del lead: ${messagesBySender.user || 0}
- Mensajes del setter: ${messagesBySender.assistant || 0}
- Tasa de respuesta: ${(engagementRate * 100).toFixed(0)}%

📊 FASES DEL PROCESO:
1. Contacto inicial (0-20%): Generar curiosidad, primer contacto
2. Calificación (21-40%): Identificar necesidad, validar fit
3. Presentación (41-60%): Mostrar valor, casos de éxito
4. Objeciones (61-80%): Resolver dudas, crear urgencia
5. Cierre (81-100%): Agendar llamada, siguiente paso

🧬 SCORING REALISTA:
- 0.0-0.2: Sin interés, respuestas cortas o negativas
- 0.3-0.4: Interés inicial, hace preguntas básicas
- 0.5-0.6: Interés moderado, comparte información del negocio
- 0.7-0.8: Alto interés, pregunta por precios/detalles
- 0.9-1.0: Listo para cerrar, solicita siguiente paso

🗣️ CONVERSACIÓN:
${conversationText}

📤 GENERA ANÁLISIS DETALLADO en JSON:
{
  "currentPhase": number (1-5 basado en el progreso real),
  "qualificationScore": number (0-1, conservador y realista),
  "leadProfile": {
    "type": "emprendedor/negocio_local/empresa/agencia/desconocido",
    "characteristics": ["5 rasgos observados en la conversación"],
    "businessType": "tipo de negocio mencionado o inferido",
    "sophisticationLevel": "bajo/medio/alto",
    "mainObjections": ["objeciones explícitas o implícitas"],
    "buyingSignals": ["indicadores positivos detectados"],
    "painPoints": ["problemas o frustraciones mencionadas"],
    "communicationStyle": "formal/casual/técnico/emocional"
  },
  "summary": "Resumen ejecutivo del estado y calidad del lead",
  "nextSteps": ["3-5 acciones específicas y prácticas"],
  "redFlags": ["señales de alerta o riesgos"],
  "opportunities": ["oportunidades no exploradas"],
  "keyInsights": ["3 insights clave sobre el lead"],
  "recommendedApproach": "estrategia recomendada para próxima interacción"
}`
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1500,
        }
      }),
    });

    let analysis;
    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      try {
        const responseText = geminiData.candidates[0].content.parts[0].text;
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing Gemini response:', e);
      }
    }

    // Fallback analysis if Gemini fails
    if (!analysis) {
      const messageCount = request.messages.length;
      const hasQuestions = conversationText.includes('?');
      const hasBusinessMention = conversationText.toLowerCase().match(/negocio|empresa|ventas|clientes/);
      
      analysis = {
        currentPhase: messageCount > 10 ? 2 : 1,
        qualificationScore: hasBusinessMention ? 0.4 : 0.2,
        leadProfile: {
          type: 'desconocido',
          characteristics: ['Conversación en desarrollo', 'Perfil por determinar'],
          businessType: 'No identificado aún',
          sophisticationLevel: 'medio',
          mainObjections: [],
          buyingSignals: hasQuestions ? ['Hace preguntas'] : [],
          painPoints: [],
          communicationStyle: 'casual'
        },
        summary: `Conversación con ${messageCount} mensajes. ${hasBusinessMention ? 'Menciona temas de negocio.' : 'Aún explorando interés.'}`,
        nextSteps: [
          'Identificar el tipo de negocio del lead',
          'Explorar necesidades específicas', 
          'Generar curiosidad sobre la solución'
        ],
        redFlags: messageCount < 3 ? ['Conversación muy corta para evaluar'] : [],
        opportunities: ['Profundizar en el negocio del lead'],
        keyInsights: ['Análisis preliminar - se necesita más interacción'],
        recommendedApproach: 'Hacer preguntas abiertas sobre su negocio y desafíos actuales'
      };
    }

    // Save analysis to database with correct structure
    // Calculate engagement metrics
    const userMessages = request.messages.filter(m => m.role === 'user').length;
    const totalMessages = request.messages.length;
    const engagementRate = totalMessages > 0 ? userMessages / totalMessages : 0;
    
    const { error: saveError } = await supabase
      .from('conversation_analysis')
      .insert({
        conversation_id: request.conversationId,
        lead_id: request.leadId,
        analysis_data: {
          current_phase: analysis.currentPhase,
          qualification_score: analysis.qualificationScore,
          lead_profile: analysis.leadProfile,
          summary: analysis.summary,
          opportunities: analysis.opportunities,
          key_insights: analysis.keyInsights,
          recommended_approach: analysis.recommendedApproach
        },
        sentiment_scores: {
          positive: analysis.qualificationScore,
          neutral: 1 - analysis.qualificationScore,
          negative: 0
        },
        phase_progress: {
          [analysis.currentPhase]: 100,
          overall: (analysis.currentPhase / 5) * 100
        },
        key_insights: analysis.keyInsights || [],
        warnings: analysis.redFlags || [],
        action_threads: analysis.nextSteps || [],
        urgency_score: Math.round(analysis.qualificationScore * 10),
        capacity_score: 5,
        engagement_score: Math.round(engagementRate * 10),
        is_current: true,
        last_message_analyzed_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Error saving analysis:', saveError);
    }

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
          recommendedApproach: analysis.recommendedApproach || ''
        },
        isNewAnalysis: true,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in ai-analyze-simple function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});