// AI Quick Actions Edge Function
// Handles sidebar quick actions: summarize, analyze phase, suggest messages

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateContent, validateGeminiModel } from '../shared/gemini-client.ts';
import { createSuccessResponse, createErrorResponse, validateRequiredFields, sanitizeInput, logSecurely, handleCors } from '../shared/utils.ts';
import { EdgePromptManager } from '../shared/database-client.ts';
import { QuickActionRequest, QuickActionResponse } from '../shared/types.ts';
import { QuickActionsService } from './quick-actions-service.ts';

serve(async (req) => {
  try {
    // Handle CORS preflight
    const corsResponse = await handleCors(req);
    if (corsResponse) return corsResponse;

    // Only accept POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse and validate request
    const requestData: QuickActionRequest = await req.json();
    
    const validationError = validateRequiredFields(requestData, ['messages', 'model', 'action']);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Validate Gemini model
    if (!validateGeminiModel(requestData.model)) {
      return createErrorResponse('Invalid Gemini model specified');
    }

    // Validate action type
    const validActions = ['summarize', 'analyze_phase', 'suggest_messages'];
    if (!validActions.includes(requestData.action)) {
      return createErrorResponse('Invalid action specified');
    }

    // Sanitize inputs
    const messages = requestData.messages.map(msg => ({
      ...msg,
      content: sanitizeInput(msg.content, 5000)
    }));

    // Log request securely
    logSecurely('Quick action requested', {
      action: requestData.action,
      model: requestData.model,
      messageCount: messages.length
    });

    // Execute quick action
    const quickActions = new QuickActionsService();
    let result: QuickActionResponse;

    switch (requestData.action) {
      case 'summarize':
        result = await quickActions.summarizeConversation(messages, requestData.model);
        break;
        
      case 'analyze_phase':
        result = await quickActions.analyzeSalesPhase(messages, requestData.model);
        break;
        
      case 'suggest_messages':
        result = await quickActions.suggestMessages(
          messages, 
          requestData.model, 
          requestData.currentPhase,
          requestData.leadType
        );
        break;
        
      default:
        return createErrorResponse('Action not implemented');
    }

    if (!result.success) {
      logSecurely('Quick action failed', {
        action: requestData.action,
        error: result.error
      });
      return createErrorResponse(result.error || 'Quick action failed', 500);
    }

    logSecurely('Quick action completed successfully', {
      action: requestData.action,
      model: requestData.model
    });

    return createSuccessResponse(result);

  } catch (error) {
    console.error('Error in ai-quick-actions function:', error);
    
    logSecurely('Quick actions error', {
      error: error.message,
      action: 'quick_actions'
    });

    return createErrorResponse('Internal server error', 500);
  }
});