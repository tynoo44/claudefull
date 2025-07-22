// Main response generation functionality for Gemini AI

import { GoogleGenerativeAI } from '@google/generative-ai';
import { promptManager } from '../prompt-manager';
import { responseValidator, ValidationConfig } from '../response-validator';
import { ConversationStateManager } from '../conversation-state-manager';
import { detectIntent, getIntentRecommendations } from '../intent-detector';
import { analyzeLeadProfile, getPersonalizationRules } from '../lead-personalizer';
import { buildHierarchicalPrompt } from './prompt-builder';
import { extractPhaseInfo, extractIntent } from './phase-extractor';
import type { GenerateResponseOptions } from './types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateAIResponse = async ({
  messages,
  model,
  conversationContext,
  currentPhase,
  leadType,
  conversationId,
  leadId,
  enableTracking = true,
}: GenerateResponseOptions): Promise<string> => {
  try {
    const geminiModel = genAI.getGenerativeModel({ model });

    // Build prompt components from database
    const components = await promptManager.buildPromptComponents(
      'main',
      currentPhase,
      leadType,
      conversationContext,
    );

    // Detectar intención y perfil del lead
    let intentContext = '';
    let personalizationContext = '';

    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);

      if (lastUserMessage.role === 'user') {
        // Análisis de intención
        const intent = detectIntent(lastUserMessage.content);
        const recommendations = getIntentRecommendations(intent);

        // Análisis de perfil del lead
        const leadProfile = analyzeLeadProfile(userMessages);
        const personalizationRules = getPersonalizationRules(leadProfile);

        // Contexto de intención
        intentContext = `\n\n# ANÁLISIS DE INTENCIÓN DEL LEAD
- Intención detectada: ${intent.primaryIntent} (confianza: ${Math.round(intent.confidence * 100)}%)
- Tono emocional: ${intent.emotionalTone}
- Señales de compra: ${intent.buyingSignals}/10
- Nivel de urgencia: ${intent.urgencyLevel}/10
${intent.objectionType ? `- Tipo de objeción: ${intent.objectionType}` : ''}

RECOMENDACIONES:
${recommendations.map((r: string) => `- ${r}`).join('\n')}`;

        // Contexto de personalización
        personalizationContext = `\n\n# PERFIL Y PERSONALIZACIÓN DEL LEAD
- Tipo de lead: ${leadProfile.type}
- Grupo de edad: ${leadProfile.ageGroup}
- Estilo de comunicación: ${leadProfile.communicationStyle}
- Nivel técnico: ${leadProfile.techSavviness}
- Estilo de decisión: ${leadProfile.decisionMakingStyle}

REGLAS DE PERSONALIZACIÓN:
- Usa vocabulario: ${personalizationRules.vocabularyLevel}
- Longitud de frases: ${personalizationRules.sentenceLength}
- Usar jerga/slang: ${personalizationRules.useSlang ? 'SÍ' : 'NO'}
- Estilo de persuasión: ${personalizationRules.persuasionStyle}

EJEMPLOS DE FRASES PARA ESTE LEAD:
${personalizationRules.examplePhrases.greeting.length > 0 ? `Saludos: ${personalizationRules.examplePhrases.greeting[0]}` : ''}
${personalizationRules.examplePhrases.question.length > 0 ? `Preguntas: ${personalizationRules.examplePhrases.question[0]}` : ''}`;
      }
    }

    // Build the hierarchical prompt with intent and personalization context
    const basePrompt = buildHierarchicalPrompt(components, messages);
    const fullPrompt = basePrompt + intentContext + personalizationContext;

    // Validation configuration - Muy permisivo para respuestas naturales
    const validationConfig: ValidationConfig = {
      minScore: 0.4, // Muy bajo para permitir creatividad
      keyPhraseWeight: 0.5, // Menos énfasis en frases exactas
      strictMode: false,
      regenerateThreshold: 0.2, // Solo regenerar si es terrible
      maxRegenerationAttempts: 1, // Evitar sobre-optimización
    };

    let attempts = 0;
    let bestResponse = '';
    let bestScore = 0;

    while (attempts < validationConfig.maxRegenerationAttempts) {
      // Generate response
      const result = await geminiModel.generateContent(fullPrompt);
      const response = await result.response;
      const generatedText = response.text();

      // Validate if we have a current phase
      if (currentPhase && currentPhase >= 1 && currentPhase <= 5) {
        const validation = await responseValidator.validate(
          generatedText,
          currentPhase,
          leadType,
          validationConfig,
        );

        console.log(`Validation attempt ${attempts + 1}:`, {
          phase: currentPhase,
          score: validation.score,
          suggestions: validation.suggestions,
        });

        // Keep track of best response
        if (validation.score > bestScore) {
          bestScore = validation.score;
          bestResponse = generatedText;
        }

        // If score is acceptable, return the response
        if (validation.score >= validationConfig.minScore) {
          return generatedText;
        }

        // If score is too low and we have more attempts, regenerate with hints
        if (
          validation.score < validationConfig.regenerateThreshold &&
          attempts < validationConfig.maxRegenerationAttempts - 1
        ) {
          // Add validation hints to the prompt
          const hintsPrompt =
            fullPrompt + `\n\n# MEJORAS REQUERIDAS:\n${validation.suggestions.join('\n')}`;

          attempts++;

          // Regenerate with hints
          const hintedResult = await geminiModel.generateContent(hintsPrompt);
          const hintedResponse = await hintedResult.response;
          const hintedText = hintedResponse.text();

          // Validate the new response
          const hintedValidation = await responseValidator.validate(
            hintedText,
            currentPhase,
            leadType,
            validationConfig,
          );

          if (hintedValidation.score > bestScore) {
            bestScore = hintedValidation.score;
            bestResponse = hintedText;
          }

          if (hintedValidation.score >= validationConfig.minScore) {
            return hintedText;
          }
        }
      } else {
        // No phase specified, return without validation
        return generatedText;
      }

      attempts++;
    }

    // Return best response found
    console.log(`Returning best response with score: ${bestScore}`);

    // Update conversation state tracking if enabled
    if (enableTracking && conversationId && messages.length > 0) {
      try {
        const userMessage = messages[messages.length - 1]?.content || '';
        const detectedPhase = currentPhase || promptManager.detectCurrentPhase(messages);

        // Extract phase-specific information from the conversation
        const phaseInfo = extractPhaseInfo(messages, detectedPhase);

        const trackingResult = await ConversationStateManager.updateConversationState({
          conversationId: conversationId,
          leadId: leadId || '',
          userMessage: userMessage,
          aiResponse: bestResponse,
          currentPhase: detectedPhase,
          phaseInfo: phaseInfo,
          detectedIntent: extractIntent(userMessage),
        });

        if (trackingResult.success) {
          console.log('Conversation state updated:', {
            conversation_id: conversationId,
            phase: trackingResult.current_phase,
            score: trackingResult.qualification_score,
            phase_changed: trackingResult.phase_changed,
          });
        } else {
          console.warn('Failed to update conversation state:', trackingResult.error);
        }
      } catch (trackingError) {
        console.error('Error updating conversation tracking:', trackingError);
        // Don't throw - tracking failure shouldn't break response generation
      }
    }

    return bestResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};