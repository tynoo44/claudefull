import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import {
  generateAIResponse,
  generateQuickActions,
  AI_MODELS,
  type AIModel,
  type AIMessage as ServiceAIMessage,
} from '../../lib/ai-service';

const DEFAULT_MODEL: AIModel = 'gpt-4o-mini';
import { MessageContent } from './MessageContent';
import { promptManager } from '../../lib/prompt-manager';
import { ConversationStatusCard } from './ConversationStatusCard';
import { MessageSuggestions } from './MessageSuggestionCard';
import { useConversationAnalysis, useAIConversation } from '../../hooks/useConversationAnalysis';

interface EnhancedAIChatSidebarProps {
  darkMode: boolean;
  conversationContext?: string;
  currentConversation?: Record<string, unknown>;
  conversationId?: string;
  leadId?: string;
  leadName?: string;
  isAnalyzing?: boolean;
  analysisError?: string;
  leadData?: {
    tags?: string[];
    notes?: string;
    lead_insights?: {
      business_info?: any;
      personality_profile?: any;
      confidence_score?: number;
    };
  };
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Helper function to convert local AIMessage to ai-service AIMessage
const convertToServiceMessage = (message: AIMessage): ServiceAIMessage => ({
  role: message.role,
  content: message.content,
  timestamp: message.timestamp.toISOString(),
});

interface MessageSuggestion {
  id: string;
  type: 'direct' | 'exploratory' | 'creative';
  message: string;
  strategy: string;
  confidence: number;
  phase: number;
  reasoning: string;
}

export const EnhancedAIChatSidebar: React.FC<EnhancedAIChatSidebarProps> = ({
  darkMode,
  conversationContext,
  currentConversation,
  conversationId,
  leadId,
  leadName,
  isAnalyzing: _isAnalyzing,
  analysisError: _analysisError,
  leadData,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([]);
  const [usedSuggestions, setUsedSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Hooks para análisis y conversación AI
  const {
    analysis,
    isLoading: analysisLoading,
    refreshAnalysis,
    isRefreshing,
  } = useConversationAnalysis(conversationId);

  const { aiConversation, saveAIConversation } = useAIConversation(conversationId);

  // Cargar conversación AI existente
  useEffect(() => {
    if (aiConversation?.messages && Array.isArray(aiConversation.messages)) {
      setMessages(
        aiConversation.messages.map(
          (msg: { id?: string; role: string; content: string; timestamp?: string | number }) => ({
            id: msg.id || Date.now().toString(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now()),
          }),
        ),
      );
    }
  }, [aiConversation]);

  // Guardar conversación AI cuando cambian los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      const messagesToSave = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));
      saveAIConversation(messagesToSave);
    }
  }, [messages, saveAIConversation]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build conversation context and messages from actual conversation
      let fullContext = conversationContext || '';
      let allMessages: ServiceAIMessage[] = [];

      if (currentConversation?.messages && Array.isArray(currentConversation.messages)) {
        // Convert conversation messages to AI format
        allMessages = (currentConversation.messages as Record<string, unknown>[]).map(msg => ({
          role: (msg.sender_type === 'Setter' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: String(msg.text || msg.content || ''),
        }));

        const conversationMessages = (currentConversation.messages as Record<string, unknown>[])
          .map(
            msg =>
              `${msg.sender_type === 'Setter' ? 'Setter' : 'Lead'}: ${msg.text || msg.content || ''}`,
          )
          .join('\n');
        fullContext = `Conversación actual con ${leadName || 'el lead'}:\n${conversationMessages}`;
      }

      // Add the user's question to the conversation
      allMessages.push(convertToServiceMessage(userMessage));

      const currentPhase = promptManager.detectCurrentPhase(allMessages);

      const response = await generateAIResponse({
        messages: allMessages,
        model: selectedModel,
        conversationContext: fullContext,
        currentPhase,
        conversationId,
        leadId,
        enableTracking: true,
      });

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (_error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ups, algo salió mal. Revisa tu conexión o prueba con otro modelo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSuggestions = async () => {
    if (!currentConversation?.messages || !Array.isArray(currentConversation.messages)) {
      return;
    }

    setIsGeneratingSuggestions(true);

    try {
      const conversationMessages: ServiceAIMessage[] = (
        currentConversation.messages as Record<string, unknown>[]
      ).map(msg => ({
        role: (msg.sender_type === 'Setter' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: String(msg.text || msg.content || ''),
      }));

      const currentPhase = analysis?.analysis_data?.current_phase || 1;
      const leadType = 'general'; // TODO: Implement lead_type detection

      const response = await generateQuickActions.suggestMessages(
        conversationMessages,
        selectedModel,
        currentPhase,
        leadType,
      );

      // Parsear las sugerencias del response (formato mejorado)
      const parsedSuggestions = parseSuggestionsFromResponse(response, currentPhase);
      setSuggestions(parsedSuggestions);
    } catch (_error) {
      console.error('Error generating suggestions:', _error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const parseSuggestionsFromResponse = (response: string, phase: number): MessageSuggestion[] => {
    try {
      // Split the response by double newlines to get individual suggestions
      const suggestionTexts = response
        .split('\n\n')
        .filter(text => text.trim())
        .slice(0, 3);

      if (suggestionTexts.length === 0) {
        // If no suggestions parsed, split by single newlines
        const altSuggestions = response
          .split('\n')
          .filter(text => text.trim() && text.length > 20)
          .slice(0, 3);

        if (altSuggestions.length > 0) {
          suggestionTexts.push(...altSuggestions);
        }
      }

      // Map suggestions to the expected format
      const suggestions: MessageSuggestion[] = suggestionTexts.map((text, index) => {
        // Determine type based on position and content
        let type: 'direct' | 'exploratory' | 'creative' = 'direct';
        let strategy = '';
        let confidence = 0.7;

        if (index === 0) {
          type = 'direct';
          strategy = 'Respuesta directa que va al punto principal';
          confidence = 0.85;
        } else if (index === 1) {
          type = 'exploratory';
          strategy = 'Pregunta exploratoria para profundizar';
          confidence = 0.75;
        } else {
          type = 'creative';
          strategy = 'Enfoque creativo y personalizado';
          confidence = 0.65;
        }

        // Analyze content for better classification
        const lowerText = text.toLowerCase();
        if (lowerText.includes('?') || lowerText.includes('cómo') || lowerText.includes('qué')) {
          type = 'exploratory';
          strategy = 'Pregunta estratégica para obtener más información';
        } else if (lowerText.includes('imagino') || lowerText.includes('entiendo')) {
          type = 'creative';
          strategy = 'Conexión empática con el lead';
        }

        return {
          id: `suggestion-${Date.now()}-${index}`,
          type,
          message: text.trim(),
          strategy,
          confidence,
          phase,
          reasoning: `Sugerencia optimizada para fase ${phase} del proceso de ventas`,
        };
      });

      // If no suggestions were parsed, return a default set
      if (suggestions.length === 0) {
        return [
          {
            id: 'default-1',
            type: 'direct',
            message: 'Cuéntame más sobre tu situación actual...',
            strategy: 'Pregunta abierta para obtener más contexto',
            confidence: 0.6,
            phase,
            reasoning: 'Respuesta genérica cuando no hay suficiente contexto',
          },
        ];
      }

      return suggestions;
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      return [
        {
          id: 'error-1',
          type: 'direct',
          message: 'Háblame más sobre lo que necesitas...',
          strategy: 'Pregunta de recuperación',
          confidence: 0.5,
          phase,
          reasoning: 'Fallback cuando hay error en el parseo',
        },
      ];
    }
  };

  const handleCopyMessage = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      // Podríamos mostrar una notificación aquí
    } catch (_error) {
      console.error('Error copying message:', _error);
    }
  };

  const handleSaveAsTemplate = (message: string, strategy: string) => {
    // Implementar guardado como template
    console.log('Saving as template:', { message, strategy });
  };

  const handleMarkAsUsed = (suggestionId: string) => {
    setUsedSuggestions(prev => [...prev, suggestionId]);
  };

  const keyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      {/* Header con tabs */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Asistente AI
            </h3>
          </div>

          {/* Selector de modelo */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded text-xs border
                ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Sparkles className="w-3 h-3" />
              {selectedModel === 'gpt-5.4' ? '5.4' : 'Mini'}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModelDropdown && (
              <div
                className={`
                absolute top-full right-0 mt-1 border rounded shadow-lg z-50 min-w-32
                ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
              `}
              >
                {Object.entries(AI_MODELS).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedModel(key as AIModel);
                      setShowModelDropdown(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-xs first:rounded-t last:rounded-b
                      ${selectedModel === key ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}
                      ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all
              ${
                activeTab === 'analysis'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <BarChart3 className="w-4 h-4" />
            Análisis
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all
              ${
                activeTab === 'chat'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <MessageSquare className="w-4 h-4" />
            Chat IA
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'analysis' ? (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Estado de la conversación */}
            <ConversationStatusCard
              status={
                analysis
                  ? {
                      current_phase: analysis.analysis_data?.current_phase || 1,
                      phase_progress: analysis.phase_progress || {},
                      sentiment_scores: analysis.sentiment_scores,
                      key_insights: analysis.key_insights || [],
                      warnings: analysis.warnings || [],
                      action_threads: analysis.action_threads || [],
                      urgency_score: analysis.urgency_score || 0,
                      capacity_score: analysis.capacity_score || 0,
                      engagement_score: analysis.engagement_score || 0,
                      updated_at: analysis.updated_at,
                    }
                  : null
              }
              isLoading={analysisLoading}
              onRefresh={refreshAnalysis}
              isRefreshing={isRefreshing}
              darkMode={darkMode}
              leadName={leadName}
              leadData={{
                tags: leadData?.tags,
                notes: leadData?.notes,
                insights: leadData?.lead_insights
                  ? {
                      business_info: leadData.lead_insights.business_info,
                      personality_profile: leadData.lead_insights.personality_profile,
                      confidence_score: leadData.lead_insights.confidence_score,
                    }
                  : undefined,
              }}
            />

            {/* Sugerencias de mensajes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Sugerencias de Respuesta
                </h4>
                <button
                  onClick={generateSuggestions}
                  disabled={isGeneratingSuggestions}
                  className={`
                    flex items-center gap-1 px-3 py-1 rounded text-xs transition-all
                    ${
                      isGeneratingSuggestions
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                  `}
                >
                  <Lightbulb className="w-3 h-3" />
                  {isGeneratingSuggestions ? 'Generando...' : 'Generar'}
                </button>
              </div>

              <MessageSuggestions
                suggestions={suggestions}
                onCopy={handleCopyMessage}
                onSaveAsTemplate={handleSaveAsTemplate}
                onMarkAsUsed={handleMarkAsUsed}
                darkMode={darkMode}
                usedSuggestions={usedSuggestions}
              />
            </div>
          </div>
        ) : (
          /* Chat con la IA */
          <div className="flex flex-col h-full">
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Pregúntame lo que necesites sobre esta conversación
                  </p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm
                        ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-100'
                              : 'bg-white text-gray-800 border border-gray-200'
                        }
                      `}
                    >
                      <MessageContent content={message.content} />
                      <div className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div
                    className={`
                    max-w-xs px-3 py-2 rounded-lg text-sm
                    ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800 border border-gray-200'}
                  `}
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={keyPress}
                  placeholder="Pregunta sobre la conversación..."
                  className={`
                    flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                  `}
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className={`
                    px-3 py-2 rounded-lg transition-all
                    ${
                      !input.trim() || isTyping
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
