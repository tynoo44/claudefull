// N8N Integration Service - Centralized webhook handler for all AI operations
// This service ensures 100% compatibility between our AI features and n8n workflows

interface N8NWebhookPayload {
  event: string;
  data: any;
  metadata?: {
    timestamp: string;
    source: string;
    userId?: string;
    conversationId?: string;
    leadId?: string;
  };
}

interface N8NResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class N8NIntegrationService {
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
    this.enabled = !!this.webhookUrl;
    
    if (this.enabled) {
      console.log('✅ N8N Integration enabled:', this.webhookUrl);
    } else {
      console.log('⚠️ N8N Integration disabled - no webhook URL configured');
    }
  }

  /**
   * Send event to n8n webhook
   */
  private async sendToN8N(payload: N8NWebhookPayload): Promise<N8NResponse> {
    if (!this.enabled) {
      return { success: true, data: { skipped: true, reason: 'N8N integration disabled' } };
    }

    try {
      const response = await fetch(this.webhookUrl, {
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

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        // If response is not JSON, treat as success
        responseData = { success: true };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('Error sending to N8N:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * AI Response Generation Event
   */
  async onAIResponseGenerated(data: {
    conversationId?: string;
    leadId?: string;
    messages: any[];
    response: string;
    model: string;
    metadata?: any;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'ai_response_generated',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'ai-service',
        conversationId: data.conversationId,
        leadId: data.leadId,
      },
    });
  }

  /**
   * Conversation Analysis Event
   */
  async onConversationAnalyzed(data: {
    conversationId: string;
    leadId: string;
    analysis: any;
    isNewAnalysis: boolean;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'conversation_analyzed',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'conversation-analyzer',
        conversationId: data.conversationId,
        leadId: data.leadId,
      },
    });
  }

  /**
   * Message Suggestions Generated Event
   */
  async onSuggestionsGenerated(data: {
    conversationId?: string;
    leadId?: string;
    suggestions: string[];
    phase: number;
    leadType?: string;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'suggestions_generated',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'quick-actions',
        conversationId: data.conversationId,
        leadId: data.leadId,
      },
    });
  }

  /**
   * Lead Profile Analysis Event
   */
  async onLeadProfileAnalyzed(data: {
    leadId: string;
    profile: any;
    insights: any;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'lead_profile_analyzed',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'lead-personalizer',
        leadId: data.leadId,
      },
    });
  }

  /**
   * Intent Detection Event
   */
  async onIntentDetected(data: {
    conversationId?: string;
    leadId?: string;
    message: string;
    intent: any;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'intent_detected',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'intent-detector',
        conversationId: data.conversationId,
        leadId: data.leadId,
      },
    });
  }

  /**
   * Message Sent Event (for tracking)
   */
  async onMessageSent(data: {
    conversationId: string;
    leadId: string;
    message: string;
    senderType: 'Lead' | 'Setter';
    platform?: string;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'message_sent',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'chat-interface',
        conversationId: data.conversationId,
        leadId: data.leadId,
      },
    });
  }

  /**
   * Phase Change Event
   */
  async onPhaseChanged(data: {
    conversationId: string;
    leadId: string;
    previousPhase: number;
    newPhase: number;
    reason?: string;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'phase_changed',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'phase-analyzer',
        conversationId: data.conversationId,
        leadId: data.leadId,
      },
    });
  }

  /**
   * Lead Score Update Event
   */
  async onLeadScoreUpdated(data: {
    leadId: string;
    previousScore: number;
    newScore: number;
    factors: any;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'lead_score_updated',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'scoring-engine',
        leadId: data.leadId,
      },
    });
  }

  /**
   * Calendar Event Created/Updated (for appointment tracking)
   */
  async onCalendarEventChanged(data: {
    eventId: string;
    leadId?: string;
    conversationId?: string;
    action: 'created' | 'updated' | 'deleted';
    eventData: any;
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'calendar_event_changed',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'calendar-service',
        leadId: data.leadId,
        conversationId: data.conversationId,
      },
    });
  }

  /**
   * Batch Analysis Request (for bulk operations)
   */
  async requestBatchAnalysis(data: {
    conversationIds: string[];
    analysisType: 'full' | 'sentiment' | 'phase' | 'scoring';
    priority?: 'high' | 'normal';
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'batch_analysis_requested',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'batch-processor',
      },
    });
  }

  /**
   * Error Reporting (for debugging)
   */
  async reportError(data: {
    error: string;
    context: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<N8NResponse> {
    return this.sendToN8N({
      event: 'error_reported',
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'error-handler',
      },
    });
  }

  /**
   * Custom Event (for extensibility)
   */
  async sendCustomEvent(eventName: string, data: any, metadata?: any): Promise<N8NResponse> {
    return this.sendToN8N({
      event: `custom_${eventName}`,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'custom',
        ...metadata,
      },
    });
  }

  /**
   * Check if N8N integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get webhook URL (masked for security)
   */
  getWebhookInfo(): { enabled: boolean; url?: string } {
    if (!this.enabled) {
      return { enabled: false };
    }

    // Mask the URL for security
    const url = new URL(this.webhookUrl);
    const maskedUrl = `${url.protocol}//${url.hostname}/***`;
    
    return {
      enabled: true,
      url: maskedUrl,
    };
  }
}

// Export singleton instance
export const n8nIntegration = new N8NIntegrationService();

// Export types for use in other files
export type { N8NWebhookPayload, N8NResponse };