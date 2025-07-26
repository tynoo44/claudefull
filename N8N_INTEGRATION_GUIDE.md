# N8N Integration Guide for Setter AI

## Overview

Setter AI now has **100% n8n webhook integration** for all AI-related operations. This allows you to create powerful automation workflows that react to AI events in real-time.

## Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# N8N Webhook URL (required for n8n integration)
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# For Supabase Edge Functions (optional - uses VITE_N8N_WEBHOOK_URL if not set)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

### 2. Testing the Integration

Run the test script to verify n8n integration:

```bash
npx tsx src/scripts/test-n8n-integration.ts
```

## Available Webhook Events

All events follow this structure:

```json
{
  "event": "event_name",
  "data": {
    // Event-specific data
  },
  "metadata": {
    "timestamp": "2025-01-26T10:30:00Z",
    "source": "service-name",
    "edgeFunction": "function-name", // For Edge Functions
    "userId": "user-123",
    "conversationId": "conv-456",
    "leadId": "lead-789"
  }
}
```

### AI Events

#### 1. `ai_response_generated`
Triggered when AI generates a response for a conversation.

```json
{
  "event": "ai_response_generated",
  "data": {
    "conversationId": "conv-123",
    "leadId": "lead-456",
    "messages": [...],
    "response": "Generated AI response text",
    "model": "gemini-2.5-flash",
    "metadata": {
      "phase": 2,
      "score": 0.7,
      "intent": "high_interest",
      "personalization": {...}
    }
  }
}
```

#### 2. `conversation_analyzed`
Triggered when a conversation is analyzed for insights.

```json
{
  "event": "conversation_analyzed",
  "data": {
    "conversationId": "conv-123",
    "leadId": "lead-456",
    "analysis": {
      "currentPhase": 2,
      "qualificationScore": 0.65,
      "leadProfile": {...},
      "summary": "Lead shows interest...",
      "nextSteps": [...],
      "redFlags": [...]
    },
    "isNewAnalysis": true,
    "scores": {
      "qualification": 0.65,
      "urgency": 7,
      "engagement": 8
    }
  }
}
```

#### 3. `ai_suggestions_generated`
Triggered when AI generates message suggestions.

```json
{
  "event": "ai_suggestions_generated",
  "data": {
    "suggestions": [
      "Suggestion 1...",
      "Suggestion 2...",
      "Suggestion 3..."
    ],
    "phase": 2,
    "leadType": "entrepreneur",
    "messageCount": 10
  }
}
```

### Lead Events

#### 4. `intent_detected`
Triggered when intent is detected in a lead's message.

```json
{
  "event": "intent_detected",
  "data": {
    "conversationId": "conv-123",
    "leadId": "lead-456",
    "message": "Original message text",
    "intent": {
      "primaryIntent": "high_interest",
      "confidence": 0.85,
      "emotionalTone": "excited",
      "buyingSignals": 8,
      "urgencyLevel": 7,
      "context": {...}
    }
  }
}
```

#### 5. `lead_profile_analyzed`
Triggered when a lead's profile is analyzed.

```json
{
  "event": "lead_profile_analyzed",
  "data": {
    "leadId": "lead-456",
    "profile": {
      "type": "young_entrepreneur",
      "ageGroup": "millennial",
      "communicationStyle": "casual",
      "techSavviness": "high",
      "decisionMakingStyle": "quick"
    },
    "insights": {
      "messageCount": 15,
      "averageMessageLength": 45,
      "vocabulary": "casual",
      "engagement": "medium"
    }
  }
}
```

#### 6. `phase_changed`
Triggered when a lead moves to a different sales phase.

```json
{
  "event": "phase_changed",
  "data": {
    "conversationId": "conv-123",
    "leadId": "lead-456",
    "previousPhase": 1,
    "newPhase": 2,
    "reason": "Lead expressed interest and asked about pricing"
  }
}
```

#### 7. `lead_score_updated`
Triggered when a lead's qualification score changes.

```json
{
  "event": "lead_score_updated",
  "data": {
    "leadId": "lead-456",
    "previousScore": 0.3,
    "newScore": 0.7,
    "factors": {
      "priceInquiry": true,
      "urgencyExpressed": true,
      "businessMentioned": true
    }
  }
}
```

### Message Events

#### 8. `message_sent`
Triggered when a message is sent (by Setter or Lead).

```json
{
  "event": "message_sent",
  "data": {
    "conversationId": "conv-123",
    "leadId": "lead-456",
    "message": "Message text",
    "senderType": "Setter",
    "platform": "instagram"
  }
}
```

### System Events

#### 9. `error_reported`
Triggered when an error occurs in the system.

```json
{
  "event": "error_reported",
  "data": {
    "error": "Error description",
    "context": {
      "function": "function-name",
      "timestamp": "2025-01-26T10:30:00Z"
    },
    "severity": "low|medium|high|critical"
  }
}
```

#### 10. `custom_*`
Custom events can be sent using:

```javascript
n8nIntegration.sendCustomEvent('my_event', data, metadata);
```

## N8N Workflow Examples

### Example 1: Lead Scoring Automation

```yaml
Trigger: Webhook (ai_response_generated)
↓
Filter: Check if score > 0.7
↓
Update CRM: Mark lead as "Hot"
↓
Send Notification: Alert sales team
↓
Schedule Task: Follow up in 2 hours
```

### Example 2: Conversation Analysis Pipeline

```yaml
Trigger: Webhook (conversation_analyzed)
↓
Check Phase: Is phase >= 3?
↓
Extract Data: Get lead profile
↓
Enrich: Add to Google Sheets
↓
AI Action: Generate personalized email
↓
Send Email: Via Gmail
```

### Example 3: Intent-Based Routing

```yaml
Trigger: Webhook (intent_detected)
↓
Switch: Based on primaryIntent
  → "high_interest": Send to sales team
  → "price_objection": Send pricing guide
  → "technical_question": Route to support
  → "not_interested": Add to nurture campaign
```

## Integration Points

### Frontend (React)
- `src/lib/n8n-integration.ts` - Main integration service
- All AI services automatically send webhooks
- Manual events can be triggered anywhere

### Backend (Supabase Edge Functions)
- `supabase/functions/shared/n8n-webhook.ts` - Shared webhook utility
- All Edge Functions support n8n webhooks
- Dual support for N8N_ENDPOINT (legacy) and N8N_WEBHOOK_URL

### Services Integrated
✅ AI Response Generation (`ai-service.ts`)
✅ Conversation Analysis (`conversationAnalysisService.ts`)
✅ Intent Detection (`intent-detector.ts`)
✅ Lead Personalization (`lead-personalizer.ts`)
✅ Message Sending (`supabase-functions.ts`)
✅ All Supabase Edge Functions

## Best Practices

1. **Error Handling**: All webhook calls are non-blocking and include error handling
2. **Performance**: Webhooks are sent asynchronously to not impact user experience
3. **Security**: Webhook URLs are masked in logs for security
4. **Extensibility**: Use custom events for additional automation needs
5. **Testing**: Always test webhooks with the provided test script

## Troubleshooting

### Webhooks Not Firing
1. Check if `VITE_N8N_WEBHOOK_URL` is set in `.env`
2. Run the test script to verify connectivity
3. Check browser console for webhook errors

### Edge Functions Not Sending Webhooks
1. Ensure `N8N_WEBHOOK_URL` is set in Supabase secrets
2. Check Edge Function logs in Supabase dashboard
3. Verify CORS settings if calling from browser

### Data Not Arriving in N8N
1. Check n8n webhook node is active
2. Verify webhook URL matches exactly
3. Check n8n execution logs for errors
4. Ensure n8n instance is accessible from your app

## Advanced Usage

### Batch Processing
For bulk operations, use:
```javascript
await n8nIntegration.requestBatchAnalysis({
  conversationIds: ['conv-1', 'conv-2', 'conv-3'],
  analysisType: 'full',
  priority: 'high'
});
```

### Calendar Integration
When appointments are created:
```javascript
await n8nIntegration.onCalendarEventChanged({
  eventId: 'event-123',
  leadId: 'lead-456',
  conversationId: 'conv-789',
  action: 'created',
  eventData: { ... }
});
```

### Custom Workflows
Create specialized workflows:
```javascript
// Track conversion funnel
await n8nIntegration.sendCustomEvent('funnel_stage_reached', {
  stage: 'pricing_discussion',
  leadId: 'lead-456',
  previousStage: 'interest_shown',
  timeInStage: 300 // seconds
});
```

## Support

For issues or questions:
1. Check the test script output
2. Review Edge Function logs
3. Verify n8n workflow configuration
4. Check webhook payload structure matches examples

---

**Last Updated**: January 26, 2025
**Version**: 1.0.0
**Status**: ✅ Fully Integrated