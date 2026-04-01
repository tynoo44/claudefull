/// <reference types="https://deno.land/x/deno@v1.36.4/lib/deno.ns.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/utils.ts';
import { sendToN8N, N8N_EVENTS, createN8NPayload } from '../shared/n8n-webhook.ts';

interface SendMessageRequest {
  instagram_id: string;
  message: string;
  conversation_id?: string;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client to verify authentication
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

    // Parse request body
    const { instagram_id, message, conversation_id } = (await req.json()) as SendMessageRequest;

    if (!instagram_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: instagram_id, message' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Get N8N endpoint from secret (for legacy support)
    const n8nEndpoint = Deno.env.get('N8N_ENDPOINT');
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || n8nEndpoint;

    if (!n8nWebhookUrl) {
      return new Response(JSON.stringify({ error: 'N8N webhook URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the legacy endpoint for message sending
    const messageEndpoint = n8nEndpoint || n8nWebhookUrl;
    const n8nResponse = await fetch(messageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instagram_id,
        message,
        conversation_id,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send message via n8n',
          status: n8nResponse.status,
          details: errorText,
        }),
        {
          status: n8nResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Get response from n8n
    let n8nData: any;
    try {
      n8nData = await n8nResponse.json();
    } catch (e) {
      // If n8n doesn't return JSON, just return success
      n8nData = { success: true };
    }

    // Send event to n8n webhook for tracking
    await sendToN8N(
      createN8NPayload(
        N8N_EVENTS.MESSAGE_SENT,
        {
          instagram_id,
          message,
          conversation_id,
          senderType: 'Setter',
          platform: 'instagram',
          n8nResponse: n8nData,
        },
        'send-message',
        {
          userId: user.id,
          conversationId: conversation_id,
        },
      ),
    );

    // Return the n8n response to the client
    return new Response(
      JSON.stringify({
        success: true,
        instagram_id,
        message,
        conversation_id,
        n8n_response: n8nData,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in send-message function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
