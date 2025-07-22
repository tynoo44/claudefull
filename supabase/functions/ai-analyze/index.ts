// AI Conversation Analysis Edge Function
// Handles comprehensive conversation analysis with memory management

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateContent } from '../shared/gemini-client.ts';
import { createSuccessResponse, createErrorResponse, validateRequiredFields, sanitizeInput, logSecurely, handleCors } from '../shared/utils.ts';
import { EdgePromptManager } from '../shared/database-client.ts';
import { AnalyzeConversationRequest, AnalyzeConversationResponse, AIMessage } from '../shared/types.ts';
import { ConversationAnalyzer } from './conversation-analyzer.ts';

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
    const requestData: AnalyzeConversationRequest = await req.json();
    
    const validationError = validateRequiredFields(requestData, [
      'conversationId', 
      'leadId', 
      'messages'
    ]);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Sanitize inputs
    const sanitizedMessages = requestData.messages.map(msg => ({
      ...msg,
      content: sanitizeInput(msg.content, 5000)
    }));

    // Log request securely
    logSecurely('Conversation analysis requested', {
      userId: requestData.leadId,
      conversationId: requestData.conversationId,
      action: 'analyze_conversation',
      messageCount: sanitizedMessages.length
    });

    // Perform analysis
    const analyzer = new ConversationAnalyzer();
    const result = await analyzer.analyzeConversation({
      conversationId: requestData.conversationId,
      leadId: requestData.leadId,
      messages: sanitizedMessages,
      forceReanalyze: requestData.forceReanalyze
    });

    if (!result.success) {
      logSecurely('Conversation analysis failed', {
        userId: requestData.leadId,
        conversationId: requestData.conversationId,
        error: result.error
      });
      return createErrorResponse(result.error || 'Analysis failed', 500);
    }

    logSecurely('Conversation analysis completed', {
      userId: requestData.leadId,
      conversationId: requestData.conversationId,
      isNewAnalysis: result.isNewAnalysis
    });

    const response: AnalyzeConversationResponse = {
      success: true,
      analysis: result.analysis ? {
        currentPhase: result.analysis.currentPhase,
        qualificationScore: result.analysis.qualificationScore,
        leadProfile: result.analysis.leadProfile,
        summary: result.analysis.summary,
        nextSteps: result.analysis.nextSteps || [],
        redFlags: result.analysis.redFlags || []
      } : undefined,
      isNewAnalysis: result.isNewAnalysis
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error in ai-analyze function:', error);
    
    logSecurely('Conversation analysis error', {
      error: error.message,
      action: 'analyze_conversation'
    });

    return createErrorResponse('Internal server error', 500);
  }
});