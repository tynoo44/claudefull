import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptManager } from '../lib/prompt-manager';
import { responseValidator } from '../lib/response-validator';
import ConversationAnalyzer from '../lib/conversation-analyzer';
import { detectIntent } from '../lib/intent-detector';
import { analyzeLeadProfile } from '../lib/lead-personalizer';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock Gemini API
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() =>
        Promise.resolve({
          response: {
            text: () => 'Mocked AI response',
          },
        }),
      ),
    })),
  })),
}));

describe('AI Functions Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prompt Manager', () => {
    it('should detect current phase from conversation', () => {
      const messages = [
        { role: 'user', content: 'Hola, tengo un negocio de marketing digital' },
        { role: 'assistant', content: 'Perfecto! Cuéntame más sobre tu negocio actual' },
        { role: 'user', content: 'Llevo 2 años y genero unos 10k al mes' },
      ];

      const phase = promptManager.detectCurrentPhase(messages);
      expect(phase).toBe(1); // Should detect phase 1 (Situación Actual)
    });

    it('should build prompt components correctly', async () => {
      const components = await promptManager.buildPromptComponents('main', 1, 'entrepreneur');

      expect(components).toHaveProperty('basePrompt');
      expect(components).toHaveProperty('scriptTemplates');
      expect(components).toHaveProperty('fewShotExamples');
      expect(components).toHaveProperty('currentPhase');
      expect(components.currentPhase).toBe(1);
    });

    it('should format script templates properly', () => {
      const templates = [
        {
          phase: 1,
          template_type: 'opener',
          content: 'Hola {nombre}, ¿cómo está tu negocio de {tipo_negocio}?',
          variables: ['nombre', 'tipo_negocio'],
        },
      ];

      const formatted = promptManager.formatScriptTemplates(templates);
      expect(formatted).toContain('Hola {nombre}');
      expect(formatted).toContain('Variables disponibles: nombre, tipo_negocio');
    });

    it('should format few-shot examples correctly', () => {
      const examples = [
        {
          phase: 1,
          scenario: 'Consulta inicial',
          lead_message: 'Hola, me interesa tu servicio',
          setter_response: 'Perfecto! Cuéntame sobre tu situación actual',
        },
      ];

      const formatted = promptManager.formatFewShotExamples(examples);
      expect(formatted).toContain('Lead: Hola, me interesa tu servicio');
      expect(formatted).toContain('Setter: Perfecto! Cuéntame sobre tu situación actual');
    });
  });

  describe('Response Validator', () => {
    it('should validate responses with high scores for good responses', async () => {
      const goodResponse =
        'Perfecto! Me alegra saber que ya tienes experiencia. Cuéntame, qué es lo que más te frustra de tu situación actual con el marketing';

      const validation = await responseValidator.validate(goodResponse, 2, 'entrepreneur', {
        minScore: 0.5,
        keyPhraseWeight: 0.5,
        strictMode: false,
        regenerateThreshold: 0.3,
        maxRegenerationAttempts: 2,
      });

      expect(validation.score).toBeGreaterThan(0.5);
      expect(validation.isValid).toBe(true);
      expect(validation.suggestions).toBeDefined();
    });

    it('should validate responses with low scores for poor responses', async () => {
      const poorResponse = 'OK';

      const validation = await responseValidator.validate(poorResponse, 2, 'entrepreneur', {
        minScore: 0.5,
        keyPhraseWeight: 0.5,
        strictMode: false,
        regenerateThreshold: 0.3,
        maxRegenerationAttempts: 2,
      });

      expect(validation.score).toBeLessThan(0.5);
      expect(validation.isValid).toBe(false);
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide contextual suggestions for improvement', async () => {
      const response = 'Está bien, entiendo';

      const validation = await responseValidator.validate(response, 3, 'small_business', {
        minScore: 0.6,
        keyPhraseWeight: 0.7,
        strictMode: true,
        regenerateThreshold: 0.4,
        maxRegenerationAttempts: 3,
      });

      expect(validation.suggestions).toContain(expect.stringContaining('pregunta'));
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle different validation configs', async () => {
      const response = 'Genial, eso me ayuda a entender mejor tu situación';

      const strictValidation = await responseValidator.validate(response, 1, 'entrepreneur', {
        minScore: 0.8,
        keyPhraseWeight: 0.9,
        strictMode: true,
        regenerateThreshold: 0.7,
        maxRegenerationAttempts: 1,
      });

      const permissiveValidation = await responseValidator.validate(response, 1, 'entrepreneur', {
        minScore: 0.3,
        keyPhraseWeight: 0.3,
        strictMode: false,
        regenerateThreshold: 0.2,
        maxRegenerationAttempts: 1,
      });

      expect(strictValidation.score).toBeLessThanOrEqual(permissiveValidation.score);
    });
  });

  describe('Conversation Analyzer', () => {
    it('should analyze conversation and extract qualification data', async () => {
      const messages = [
        {
          role: 'user',
          content: 'Tengo un negocio de ecommerce, genero 15k al mes pero quiero escalar',
        },
        { role: 'assistant', content: 'Excelente! Cuéntame qué te está limitando para crecer más' },
        { role: 'user', content: 'No tengo tiempo para el marketing, estoy solo en el negocio' },
      ];

      const analysis = await ConversationAnalyzer.analyzeConversation(messages, 2);

      expect(analysis).toHaveProperty('qualification');
      expect(analysis.qualification).toHaveProperty('score');
      expect(analysis.qualification).toHaveProperty('capacityToPay');
      expect(analysis.qualification).toHaveProperty('painLevel');
      expect(analysis.qualification).toHaveProperty('urgencyLevel');
      expect(analysis.qualification).toHaveProperty('engagementLevel');

      expect(analysis.qualification.score).toBeGreaterThan(0);
      expect(analysis.qualification.capacityToPay).toBeGreaterThan(0.7); // Has good revenue
      expect(analysis.qualification.painLevel).toBeGreaterThan(0.5); // Expressed pain points
    });

    it('should detect phase progression correctly', async () => {
      const phaseOneMessages = [
        { role: 'user', content: 'Hola, tengo una consultora' },
        { role: 'assistant', content: 'Perfecto! Cuéntame sobre tu consultora' },
      ];

      const phaseTwoMessages = [
        { role: 'user', content: 'Tengo problemas para conseguir clientes consistentemente' },
        { role: 'assistant', content: 'Entiendo, eso es frustrante. Qué has intentado?' },
      ];

      const analysisPhaseOne = await ConversationAnalyzer.analyzeConversation(phaseOneMessages, 1);
      const analysisPhaseTwo = await ConversationAnalyzer.analyzeConversation(phaseTwoMessages, 2);

      expect(analysisPhaseOne.suggestedPhase).toBeLessThanOrEqual(2);
      expect(analysisPhaseTwo.suggestedPhase).toBeGreaterThanOrEqual(2);
    });

    it('should identify conversation insights and red flags', async () => {
      const messagesWithRedFlags = [
        { role: 'user', content: 'No tengo dinero ahora mismo' },
        { role: 'assistant', content: 'Entiendo tu situación' },
        { role: 'user', content: 'Ya probé con otra agencia y no funcionó' },
      ];

      const analysis = await ConversationAnalyzer.analyzeConversation(messagesWithRedFlags, 3);

      expect(analysis).toHaveProperty('insights');
      expect(analysis).toHaveProperty('redFlags');
      expect(analysis.redFlags.length).toBeGreaterThan(0);
      expect(
        analysis.redFlags.some(flag => flag.includes('presupuesto') || flag.includes('dinero')),
      ).toBe(true);
    });

    it('should calculate realistic qualification scores', async () => {
      const highQualityMessages = [
        {
          role: 'user',
          content: 'Tengo una empresa de software con 50 empleados, facturamos 2M al año',
        },
        { role: 'assistant', content: 'Impresionante! Qué desafíos tienes para seguir creciendo?' },
        { role: 'user', content: 'Necesitamos optimizar nuestro proceso de ventas urgentemente' },
      ];

      const lowQualityMessages = [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Hola! ¿En qué puedo ayudarte?' },
        { role: 'user', content: 'No sé, solo estaba mirando' },
      ];

      const highQualityAnalysis = await ConversationAnalyzer.analyzeConversation(
        highQualityMessages,
        2,
      );
      const lowQualityAnalysis = await ConversationAnalyzer.analyzeConversation(
        lowQualityMessages,
        1,
      );

      expect(highQualityAnalysis.qualification.score).toBeGreaterThan(
        lowQualityAnalysis.qualification.score,
      );
      expect(highQualityAnalysis.qualification.capacityToPay).toBeGreaterThan(0.8);
      expect(lowQualityAnalysis.qualification.score).toBeLessThan(0.4);
    });
  });

  describe('Intent Detector', () => {
    it('should detect buying signals correctly', () => {
      const buyingSignalMessage = 'Me interesa mucho, cuánto cuesta y cuándo podemos empezar?';
      const intent = detectIntent(buyingSignalMessage);

      expect(intent.primaryIntent).toBe('interest_expression');
      expect(intent.buyingSignals).toBeGreaterThan(7);
      expect(intent.urgencyLevel).toBeGreaterThan(6);
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    it('should detect objections and concerns', () => {
      const objectionMessage = 'No estoy seguro, es muy caro para mi presupuesto actual';
      const intent = detectIntent(objectionMessage);

      expect(intent.objectionType).toBe('price');
      expect(intent.emotionalTone).toBe('concerned');
      expect(intent.buyingSignals).toBeLessThan(4);
    });

    it('should analyze emotional tone accurately', () => {
      const excitedMessage = 'Esto es exactamente lo que necesitaba! Estoy muy emocionado';
      const frustratedMessage = 'Estoy harto de que nada funcione, ya no sé qué hacer';
      const neutralMessage = 'Cuéntame más detalles sobre el servicio';

      const excitedIntent = detectIntent(excitedMessage);
      const frustratedIntent = detectIntent(frustratedMessage);
      const neutralIntent = detectIntent(neutralMessage);

      expect(excitedIntent.emotionalTone).toBe('excited');
      expect(frustratedIntent.emotionalTone).toBe('frustrated');
      expect(neutralIntent.emotionalTone).toBe('neutral');
    });

    it('should provide contextual recommendations', () => {
      const priceObjectionMessage = 'Es demasiado caro para mí';
      const intent = detectIntent(priceObjectionMessage);

      expect(intent.objectionType).toBe('price');
      expect(intent.recommendations).toContain(expect.stringContaining('valor'));
      expect(intent.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle various intent types', () => {
      const questionMessage = 'Cómo funciona exactamente el proceso?';
      const informationMessage = 'Tengo una empresa de 10 empleados en Barcelona';
      const followUpMessage = 'Vale, necesito pensarlo un poco más';

      const questionIntent = detectIntent(questionMessage);
      const informationIntent = detectIntent(informationMessage);
      const followUpIntent = detectIntent(followUpMessage);

      expect(questionIntent.primaryIntent).toBe('information_seeking');
      expect(informationIntent.primaryIntent).toBe('information_sharing');
      expect(followUpIntent.primaryIntent).toBe('consideration');
    });
  });

  describe('Lead Personalizer', () => {
    it('should analyze lead profile from messages', () => {
      const entrepreneurMessages = [
        'Soy CEO de una startup tech',
        'Llevamos 3 años en el mercado',
        'Necesitamos escalar rápido, bro',
      ];

      const corporateMessages = [
        'Represento a una multinacional',
        'Necesitamos una solución enterprise',
        'Requiere integración con nuestros sistemas actuales',
      ];

      const entrepreneurProfile = analyzeLeadProfile(entrepreneurMessages);
      const corporateProfile = analyzeLeadProfile(corporateMessages);

      expect(entrepreneurProfile.type).toBe('entrepreneur');
      expect(entrepreneurProfile.ageGroup).toBe('young_professional');
      expect(entrepreneurProfile.communicationStyle).toBe('informal');

      expect(corporateProfile.type).toBe('corporate_executive');
      expect(corporateProfile.communicationStyle).toBe('formal');
      expect(corporateProfile.techSavviness).toBe('high');
    });

    it('should detect communication style accurately', () => {
      const informalMessages = ['Qué tal tío?', 'Está genial esto, me mola'];
      const formalMessages = ['Buenos días', 'Agradecería información detallada'];

      const informalProfile = analyzeLeadProfile(informalMessages);
      const formalProfile = analyzeLeadProfile(formalMessages);

      expect(informalProfile.communicationStyle).toBe('informal');
      expect(formalProfile.communicationStyle).toBe('formal');
    });

    it('should determine appropriate personalization rules', () => {
      const youngTechProfile = {
        type: 'entrepreneur',
        ageGroup: 'young_professional',
        communicationStyle: 'informal',
        techSavviness: 'high',
        businessType: 'tech_startup',
        decisionMakingStyle: 'fast',
      };

      const matureExecutiveProfile = {
        type: 'corporate_executive',
        ageGroup: 'experienced_professional',
        communicationStyle: 'formal',
        techSavviness: 'medium',
        businessType: 'traditional_business',
        decisionMakingStyle: 'methodical',
      };

      const youngTechRules = require('../lib/lead-personalizer').getPersonalizationRules(
        youngTechProfile,
      );
      const matureExecutiveRules = require('../lib/lead-personalizer').getPersonalizationRules(
        matureExecutiveProfile,
      );

      expect(youngTechRules.useSlang).toBe(true);
      expect(youngTechRules.vocabularyLevel).toBe('casual');
      expect(youngTechRules.sentenceLength).toBe('short');

      expect(matureExecutiveRules.useSlang).toBe(false);
      expect(matureExecutiveRules.vocabularyLevel).toBe('professional');
      expect(matureExecutiveRules.persuasionStyle).toBe('data_driven');
    });

    it('should provide appropriate example phrases', () => {
      const casualProfile = {
        type: 'small_business_owner',
        ageGroup: 'young_professional',
        communicationStyle: 'informal',
        techSavviness: 'low',
        businessType: 'local_service',
        decisionMakingStyle: 'emotional',
      };

      const rules = require('../lib/lead-personalizer').getPersonalizationRules(casualProfile);

      expect(
        rules.examplePhrases.greeting.some(
          (phrase: string) => phrase.includes('qué tal') || phrase.includes('hola'),
        ),
      ).toBe(true);

      expect(
        rules.examplePhrases.question.some(
          (phrase: string) =>
            phrase.toLowerCase().includes('cuéntame') || phrase.toLowerCase().includes('qué'),
        ),
      ).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a realistic conversation flow', async () => {
      const conversationMessages = [
        { role: 'user', content: 'Hola, tengo una agencia de marketing digital' },
        { role: 'assistant', content: 'Perfecto! Cuéntame más sobre tu agencia' },
        {
          role: 'user',
          content: 'Llevamos 2 años, tenemos 8 clientes fijos pero queremos crecer más',
        },
      ];

      // Test prompt manager phase detection
      const currentPhase = promptManager.detectCurrentPhase(conversationMessages);
      expect(currentPhase).toBe(1);

      // Test conversation analysis
      const analysis = await ConversationAnalyzer.analyzeConversation(
        conversationMessages,
        currentPhase,
      );
      expect(analysis.qualification.score).toBeGreaterThan(0.3);

      // Test intent detection on last message
      const lastMessage = conversationMessages[conversationMessages.length - 1].content;
      const intent = detectIntent(lastMessage);
      expect(intent.primaryIntent).toBe('information_sharing');

      // Test lead personalization
      const leadMessages = conversationMessages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);
      const profile = analyzeLeadProfile(leadMessages);
      expect(profile.type).toBe('entrepreneur');
    });

    it('should maintain consistency across multiple interactions', async () => {
      const multipleInteractions = [
        { role: 'user', content: 'Hola, soy emprendedor tech' },
        { role: 'assistant', content: 'Genial! Qué tipo de tech?' },
        { role: 'user', content: 'SaaS B2B, facturamos 50k MRR' },
        { role: 'assistant', content: 'Increíble! Qué te está frenando para llegar a 100k?' },
        { role: 'user', content: 'El customer acquisition cost está muy alto' },
      ];

      const earlyAnalysis = await ConversationAnalyzer.analyzeConversation(
        multipleInteractions.slice(0, 3),
        1,
      );
      const laterAnalysis = await ConversationAnalyzer.analyzeConversation(multipleInteractions, 2);

      // Score should improve with more quality information
      expect(laterAnalysis.qualification.score).toBeGreaterThanOrEqual(
        earlyAnalysis.qualification.score,
      );

      // Should maintain lead profile consistency
      const earlyProfile = analyzeLeadProfile(
        multipleInteractions
          .slice(0, 3)
          .filter(m => m.role === 'user')
          .map(m => m.content),
      );
      const laterProfile = analyzeLeadProfile(
        multipleInteractions.filter(m => m.role === 'user').map(m => m.content),
      );

      expect(earlyProfile.type).toBe(laterProfile.type);
      expect(earlyProfile.businessType).toBe(laterProfile.businessType);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty messages gracefully', async () => {
      const emptyMessages: any[] = [];

      expect(() => promptManager.detectCurrentPhase(emptyMessages)).not.toThrow();

      const analysis = await ConversationAnalyzer.analyzeConversation(emptyMessages, 1);
      expect(analysis.qualification.score).toBe(0);
    });

    it('should handle malformed message content', () => {
      const malformedMessages = ['', null, undefined, '   ', 'a'.repeat(10000)];

      malformedMessages.forEach(message => {
        if (message !== null && message !== undefined) {
          expect(() => detectIntent(message)).not.toThrow();
        }
      });
    });

    it('should handle invalid phase numbers', async () => {
      const messages = [{ role: 'user', content: 'Test message' }];

      const invalidPhases = [-1, 0, 6, 100, null, undefined];

      for (const phase of invalidPhases) {
        if (phase !== null && phase !== undefined) {
          const analysis = await ConversationAnalyzer.analyzeConversation(messages, phase);
          expect(analysis).toBeDefined();
        }
      }
    });

    it('should provide fallback responses when AI services fail', async () => {
      // Mock AI service failure
      vi.mocked(require('@google/generative-ai').GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: () => Promise.reject(new Error('API Error')),
        }),
      }));

      const messages = [{ role: 'user', content: 'Test message' }];

      // Should not throw and should provide fallback
      const analysis = await ConversationAnalyzer.analyzeConversation(messages, 1);
      expect(analysis).toBeDefined();
      expect(analysis.qualification.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tests', () => {
    it('should process large conversations efficiently', async () => {
      const largeConversation = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}: This is a test message with some content about business and marketing.`,
      }));

      const startTime = Date.now();
      const analysis = await ConversationAnalyzer.analyzeConversation(largeConversation, 3);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(analysis).toBeDefined();
      expect(analysis.qualification.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle concurrent analysis requests', async () => {
      const conversations = Array.from({ length: 5 }, (_, i) => [
        { role: 'user', content: `Conversation ${i} user message` },
        { role: 'assistant', content: `Conversation ${i} assistant message` },
      ]);

      const promises = conversations.map(conv => ConversationAnalyzer.analyzeConversation(conv, 1));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.qualification.score).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
