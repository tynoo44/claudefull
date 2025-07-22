// AI Response Generation Edge Function
// Handles core AI response generation with intent detection and personalization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateContent, validateGeminiModel } from '../shared/gemini-client.ts';
import { createSuccessResponse, createErrorResponse, validateRequiredFields, sanitizeInput, logSecurely, handleCors } from '../shared/utils.ts';
import { EdgePromptManager } from '../shared/database-client.ts';
import { GenerateResponseRequest, GenerateResponseResponse } from '../shared/types.ts';
import { detectIntent, analyzeLeadProfile } from './ai-analyzers.ts';
import { buildHierarchicalPrompt } from './prompt-builder.ts';
import { validateResponse } from './response-validator.ts';

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
    const requestData: GenerateResponseRequest = await req.json();
    
    const validationError = validateRequiredFields(requestData, ['messages', 'model']);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Validate Gemini model
    if (!validateGeminiModel(requestData.model)) {
      return createErrorResponse('Invalid Gemini model specified');
    }

    // Sanitize inputs
    const messages = requestData.messages.map(msg => ({
      ...msg,
      content: sanitizeInput(msg.content, 5000)
    }));

    // Log request securely
    logSecurely('AI response generation requested', {
      userId: requestData.leadId || 'anonymous',
      conversationId: requestData.conversationId,
      model: requestData.model,
      action: 'generate_response'
    });

    // Initialize services
    const promptManager = new EdgePromptManager();

    // Build prompt components from database
    const components = await promptManager.buildPromptComponents(
      'main',
      requestData.currentPhase,
      requestData.leadType,
      requestData.conversationContext
    );

    // Generate response with AI analysis
    const result = await generateAIResponseWithAnalysis({
      messages,
      model: requestData.model,
      conversationContext: requestData.conversationContext,
      currentPhase: requestData.currentPhase,
      leadType: requestData.leadType,
      conversationId: requestData.conversationId,
      leadId: requestData.leadId,
      enableTracking: requestData.enableTracking ?? true,
      promptComponents: components
    });

    logSecurely('AI response generated successfully', {
      userId: requestData.leadId || 'anonymous',
      conversationId: requestData.conversationId,
      model: requestData.model
    });

    return createSuccessResponse(result);

  } catch (error) {
    console.error('Error in ai-response function:', error);
    
    logSecurely('AI response generation failed', {
      error: error.message,
      action: 'generate_response'
    });

    return createErrorResponse('Internal server error', 500);
  }
});

async function generateAIResponseWithAnalysis({
  messages,
  model,
  conversationContext,
  currentPhase,
  leadType,
  conversationId,
  leadId,
  enableTracking,
  promptComponents
}: any): Promise<GenerateResponseResponse> {
  try {
    // Detect intent and analyze lead profile if we have messages
    let intentContext = '';
    let personalizationContext = '';
    let detectedIntent = 'general_response';
    let leadProfile = null;

    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);

      if (lastUserMessage.role === 'user') {
        // Intent analysis
        const intent = detectIntent(lastUserMessage.content);
        detectedIntent = intent.primaryIntent;

        // Lead profile analysis
        leadProfile = analyzeLeadProfile(userMessages);

        // Build context strings
        intentContext = buildIntentContext(intent);
        personalizationContext = buildPersonalizationContext(leadProfile);
      }
    }

    // Build the hierarchical prompt
    const basePrompt = buildHierarchicalPrompt(promptComponents, messages);
    const fullPrompt = basePrompt + intentContext + personalizationContext;

    // Validation configuration
    const validationConfig = {
      minScore: 0.4,
      keyPhraseWeight: 0.5,
      strictMode: false,
      regenerateThreshold: 0.2,
      maxRegenerationAttempts: 1
    };

    let bestResponse = '';
    let bestScore = 0;
    let attempts = 0;

    // Generate and validate response
    while (attempts < validationConfig.maxRegenerationAttempts) {
      const generatedText = await generateContent({ model }, fullPrompt);

      // Validate response if we have a current phase
      if (currentPhase && currentPhase >= 1 && currentPhase <= 5) {
        const validation = await validateResponse(
          generatedText,
          currentPhase,
          leadType,
          validationConfig
        );

        if (validation.score > bestScore) {
          bestScore = validation.score;
          bestResponse = generatedText;
        }

        if (validation.score >= validationConfig.minScore) {
          bestResponse = generatedText;
          break;
        }

        // Try regeneration with hints if score is too low
        if (validation.score < validationConfig.regenerateThreshold && 
            attempts < validationConfig.maxRegenerationAttempts - 1) {
          
          const hintsPrompt = fullPrompt + `\n\n# MEJORAS REQUERIDAS:\n${validation.suggestions.join('\n')}`;
          const hintedText = await generateContent({ model }, hintsPrompt);
          
          const hintedValidation = await validateResponse(
            hintedText,
            currentPhase,
            leadType,
            validationConfig
          );

          if (hintedValidation.score > bestScore) {
            bestScore = hintedValidation.score;
            bestResponse = hintedText;
          }
        }
      } else {
        bestResponse = generatedText;
        break;
      }

      attempts++;
    }

    // Update conversation state if tracking is enabled
    if (enableTracking && conversationId && messages.length > 0) {
      await updateConversationTracking({
        conversationId,
        leadId: leadId || '',
        userMessage: messages[messages.length - 1]?.content || '',
        aiResponse: bestResponse,
        currentPhase: currentPhase || 1,
        leadProfile,
        detectedIntent
      });
    }

    return {
      success: true,
      response: bestResponse,
      metadata: {
        phase: currentPhase,
        score: bestScore,
        intent: detectedIntent,
        personalization: leadProfile
      }
    };

  } catch (error) {
    console.error('Error generating AI response with analysis:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function buildIntentContext(intent: any): string {
  return `\n\n# ANÁLISIS DE INTENCIÓN DEL LEAD
- Intención detectada: ${intent.primaryIntent} (confianza: ${Math.round(intent.confidence * 100)}%)
- Tono emocional: ${intent.emotionalTone}
- Señales de compra: ${intent.buyingSignals}/10
- Nivel de urgencia: ${intent.urgencyLevel}/10
${intent.objectionType ? `- Tipo de objeción: ${intent.objectionType}` : ''}

RECOMENDACIONES:
${intent.recommendations?.map((r: string) => `- ${r}`).join('\n') || '- Mantener el tono natural'}`;
}

function buildPersonalizationContext(leadProfile: any): string {
  if (!leadProfile) return '';

  return `\n\n# PERFIL Y PERSONALIZACIÓN DEL LEAD
- Tipo de lead: ${leadProfile.type}
- Grupo de edad: ${leadProfile.ageGroup}
- Estilo de comunicación: ${leadProfile.communicationStyle}
- Nivel técnico: ${leadProfile.techSavviness}
- Estilo de decisión: ${leadProfile.decisionMakingStyle}

REGLAS DE PERSONALIZACIÓN:
- Usa vocabulario: ${leadProfile.vocabularyLevel}
- Longitud de frases: ${leadProfile.sentenceLength}
- Usar jerga/slang: ${leadProfile.useSlang ? 'SÍ' : 'NO'}
- Estilo de persuasión: ${leadProfile.persuasionStyle}`;
}

async function updateConversationTracking(params: {
  conversationId: string;
  leadId: string;
  userMessage: string;
  aiResponse: string;
  currentPhase: number;
  leadProfile: any;
  detectedIntent: string;
}) {
  try {
    // Import updateConversationState from database client
    const { updateConversationState } = await import('../shared/database-client.ts');
    
    await updateConversationState({
      conversationId: params.conversationId,
      leadId: params.leadId,
      userMessage: params.userMessage,
      aiResponse: params.aiResponse,
      currentPhase: params.currentPhase,
      phaseInfo: params.leadProfile,
      detectedIntent: params.detectedIntent
    });
  } catch (error) {
    console.error('Error updating conversation tracking:', error);
    // Don't throw - tracking failure shouldn't break response generation
  }
}