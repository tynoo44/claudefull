// N8N Webhook Integration for Supabase Edge Functions
// Provides consistent webhook functionality across all Edge Functions

interface N8NWebhookPayload {
  event: string;
  data: any;
  metadata?: {
    timestamp: string;
    source: string;
    userId?: string;
    conversationId?: string;
    leadId?: string;
    edgeFunction: string;
  };
}

export async function sendToN8N(
  payload: N8NWebhookPayload,
  n8nUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  // Get N8N webhook URL from environment or parameter
  const webhookUrl = n8nUrl || Deno.env.get('N8N_WEBHOOK_URL');

  if (!webhookUrl) {
    console.log('N8N webhook URL not configured, skipping webhook');
    return { success: true };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N webhook error:', response.status, errorText);
      return {
        success: false,
        error: `N8N webhook returned ${response.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending to N8N:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Predefined event types for consistency
export const N8N_EVENTS = {
  // AI Events
  AI_RESPONSE_GENERATED: 'ai_response_generated',
  AI_ANALYSIS_COMPLETED: 'ai_analysis_completed',
  AI_SUGGESTIONS_GENERATED: 'ai_suggestions_generated',

  // Message Events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',

  // Lead Events
  LEAD_PROFILE_ANALYZED: 'lead_profile_analyzed',
  LEAD_SCORE_UPDATED: 'lead_score_updated',
  LEAD_PHASE_CHANGED: 'lead_phase_changed',

  // Conversation Events
  CONVERSATION_STARTED: 'conversation_started',
  CONVERSATION_ANALYZED: 'conversation_analyzed',

  // System Events
  ERROR_OCCURRED: 'error_occurred',
  WEBHOOK_RECEIVED: 'webhook_received',
} as const;

// Helper to create standardized payloads
export function createN8NPayload(
  event: string,
  data: any,
  edgeFunction: string,
  additionalMetadata?: Partial<N8NWebhookPayload['metadata']>,
): N8NWebhookPayload {
  return {
    event,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'supabase-edge-function',
      edgeFunction,
      ...additionalMetadata,
    },
  };
}
