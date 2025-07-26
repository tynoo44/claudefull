// AI Quick Actions Edge Function - Simple version
// Handles quick AI actions like summarization and suggestions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendToN8N, N8N_EVENTS, createN8NPayload } from '../shared/n8n-webhook.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface QuickActionRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
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
    const request: QuickActionRequest = await req.json();

    if (!request.messages || !request.model || !request.action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check API key
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

    let prompt = '';
    
    switch (request.action) {
      case 'summarize':
        prompt = `Resume esta conversación de ventas en 2-3 líneas, destacando lo más importante:\n\n${conversationText}`;
        break;
        
      case 'analyze_phase':
        prompt = `Analiza en qué fase de ventas (1-5) se encuentra esta conversación y explica por qué en 2-3 líneas:\n\n${conversationText}`;
        break;
        
      case 'suggest_messages':
        const phase = request.currentPhase || 1;
        const phaseGoals = {
          1: 'generar curiosidad y obtener atención',
          2: 'identificar dolor/necesidad y calificar',
          3: 'presentar valor y casos de éxito',
          4: 'resolver objeciones y generar urgencia',
          5: 'cerrar siguiente paso concreto'
        };

        // Get script templates for current phase
        const { data: templates } = await supabase
          .from('script_templates')
          .select('*')
          .eq('phase', phase)
          .order('priority', { ascending: false })
          .limit(3);

        // Get few-shot examples
        const { data: examples } = await supabase
          .from('few_shot_examples')
          .select('*')
          .eq('phase', phase)
          .order('created_at', { ascending: false })
          .limit(2);

        let templateContext = '';
        if (templates && templates.length > 0) {
          templateContext = '\n\n📋 PATRONES EXITOSOS PARA ESTA FASE:\n';
          templates.forEach((template, idx) => {
            templateContext += `${idx + 1}. ${template.content}\n`;
          });
        }

        let exampleContext = '';
        if (examples && examples.length > 0) {
          exampleContext = '\n\n✨ EJEMPLOS REALES QUE FUNCIONARON:\n';
          examples.forEach((ex, idx) => {
            exampleContext += `Ejemplo ${idx + 1}:\nLead dijo: "${ex.lead_message}"\nSetter respondió: "${ex.setter_response}"\n\n`;
          });
        }

        // Analyze last messages for context
        const lastMessages = request.messages.slice(-3);
        const lastUserMessage = lastMessages.filter(m => m.role === 'user').pop();
        const messageContext = lastUserMessage ? 
          `\n🔍 ÚLTIMO MENSAJE DEL LEAD: "${lastUserMessage.content}"` : '';
        
        prompt = `Eres un setter experto de Quantum Creators. Genera 3 respuestas diferentes para continuar esta conversación.

🎯 SITUACIÓN ACTUAL:
- Fase ${phase}: ${phaseGoals[phase]}
- Tipo de lead: ${request.leadType || 'general'}
- Mensajes intercambiados: ${request.messages.length}${messageContext}
${templateContext}${exampleContext}

📋 INSTRUCCIONES ESPECÍFICAS:
1. Cada respuesta debe ser única y abordar diferentes ángulos
2. Máximo 2-3 líneas por respuesta
3. Lenguaje natural, como hablarías por WhatsApp
4. NO uses signos ¿ o ¡ al inicio
5. Primera sugerencia: Directa al punto de dolor
6. Segunda sugerencia: Pregunta que genere reflexión
7. Tercera sugerencia: Enfoque creativo o historia corta

🗣️ CONVERSACIÓN COMPLETA:
${conversationText}

✍️ GENERA 3 RESPUESTAS (separa con línea en blanco):`;
        break;
    }

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: request.action === 'suggest_messages' ? 0.9 : 0.7,
          maxOutputTokens: request.action === 'suggest_messages' ? 800 : 500,
          topP: 0.95,
          topK: 40
        }
      }),
    });

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'AI service unavailable' 
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0].content.parts[0].text;

    // Format response based on action
    let response: QuickActionResponse = { success: true };

    if (request.action === 'suggest_messages') {
      // Split suggestions by newlines and clean up
      const suggestions = responseText
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3)
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim());
        
      response.suggestions = suggestions;
      response.result = suggestions.join('\n\n');
    } else {
      response.result = responseText.trim();
    }

    // Send to n8n webhook for suggestions
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
          {
            userId: user.id,
          }
        )
      );
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in ai-quick-actions-simple function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
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