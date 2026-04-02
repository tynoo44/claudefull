import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  BarChart3,
  Zap,
  Copy,
  Check,
  AlertCircle,
  Trash2,
  FileText,
  Search,
} from 'lucide-react';
import {
  generateAIResponse,
  generateQuickActions,
  AI_MODELS,
  type AIModel,
  type AIMessage as ServiceAIMessage,
} from '../../lib/ai-service';

const DEFAULT_MODEL: AIModel = 'gpt-5.4';
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
  isError?: boolean;
}

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

// Quick prompt suggestions for empty state
const QUICK_PROMPTS = [
  {
    icon: Search,
    label: 'Analizar intención',
    prompt: 'Analiza la intención real del lead en esta conversación',
  },
  {
    icon: Lightbulb,
    label: 'Mejor respuesta',
    prompt: 'Cual sería la mejor respuesta para avanzar con este lead?',
  },
  {
    icon: FileText,
    label: 'Resumen rápido',
    prompt: 'Dame un resumen ejecutivo de esta conversación',
  },
  {
    icon: Zap,
    label: 'Objeciones',
    prompt: 'Identifica las objeciones del lead y cómo superarlas',
  },
];

// Toast notification component
const Toast: React.FC<{ message: string; visible: boolean; type?: 'success' | 'error' }> = ({
  message,
  visible,
  type = 'success',
}) => (
  <div
    className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl shadow-lg text-sm font-medium
      transition-all duration-300 flex items-center gap-2
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
    `}
  >
    {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
    {message}
  </div>
);

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
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: 'success' | 'error';
  }>({
    message: '',
    visible: false,
    type: 'success',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    analysis,
    isLoading: analysisLoading,
    refreshAnalysis,
    isRefreshing,
  } = useConversationAnalysis(conversationId);

  const { aiConversation, saveAIConversation } = useAIConversation(conversationId);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Load existing AI conversation
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

  // Save AI conversation when messages change
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

  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt || input.trim();
    if (!messageText) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Switch to chat tab if sending from quick prompts
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    try {
      let fullContext = conversationContext || '';
      let allMessages: ServiceAIMessage[] = [];

      if (currentConversation?.messages && Array.isArray(currentConversation.messages)) {
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
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : 'Error desconocido';

      let userFriendlyMessage = 'No pude procesar tu solicitud.';
      if (errorDetail.includes('401') || errorDetail.includes('Unauthorized')) {
        userFriendlyMessage = 'Sesión expirada. Recarga la página para continuar.';
      } else if (errorDetail.includes('API key') || errorDetail.includes('OPENAI')) {
        userFriendlyMessage = 'La API de IA no está configurada. Contacta al administrador.';
      } else if (errorDetail.includes('503') || errorDetail.includes('unavailable')) {
        userFriendlyMessage =
          'El servicio de IA está temporalmente ocupado. Intenta en unos segundos.';
      } else if (errorDetail.includes('fetch') || errorDetail.includes('network')) {
        userFriendlyMessage = 'Sin conexión. Verifica tu internet e intenta de nuevo.';
      }

      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: userFriendlyMessage,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSuggestions = async () => {
    if (!currentConversation?.messages || !Array.isArray(currentConversation.messages)) {
      showToast('Selecciona una conversación primero', 'error');
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
      const leadType = 'general';

      const response = await generateQuickActions.suggestMessages(
        conversationMessages,
        selectedModel,
        currentPhase,
        leadType,
      );

      const parsedSuggestions = parseSuggestionsFromResponse(response, currentPhase);
      setSuggestions(parsedSuggestions);
      showToast(`${parsedSuggestions.length} sugerencias generadas`);
    } catch (_error) {
      console.error('Error generating suggestions:', _error);
      showToast('Error al generar sugerencias', 'error');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const parseSuggestionsFromResponse = (response: string, phase: number): MessageSuggestion[] => {
    try {
      const suggestionTexts = response
        .split('\n\n')
        .filter(text => text.trim())
        .slice(0, 3);

      if (suggestionTexts.length === 0) {
        const altSuggestions = response
          .split('\n')
          .filter(text => text.trim() && text.length > 20)
          .slice(0, 3);

        if (altSuggestions.length > 0) {
          suggestionTexts.push(...altSuggestions);
        }
      }

      const suggestions: MessageSuggestion[] = suggestionTexts.map((text, index) => {
        let type: 'direct' | 'exploratory' | 'creative' = 'direct';
        let strategy = '';
        let confidence = 0.7;

        if (index === 0) {
          type = 'direct';
          strategy = 'Respuesta directa al punto de dolor';
          confidence = 0.85;
        } else if (index === 1) {
          type = 'exploratory';
          strategy = 'Pregunta que genera reflexión';
          confidence = 0.75;
        } else {
          type = 'creative';
          strategy = 'Enfoque creativo y personalizado';
          confidence = 0.65;
        }

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
      showToast('Mensaje copiado al portapapeles');
    } catch (_error) {
      console.error('Error copying message:', _error);
      showToast('No se pudo copiar', 'error');
    }
  };

  const handleSaveAsTemplate = (message: string, strategy: string) => {
    console.log('Saving as template:', { message, strategy });
    showToast('Guardado como plantilla');
  };

  const handleMarkAsUsed = (suggestionId: string) => {
    setUsedSuggestions(prev => [...prev, suggestionId]);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleCopyAIMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast('Respuesta copiada');
    } catch (_error) {
      showToast('No se pudo copiar', 'error');
    }
  };

  const keyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasConversation = Boolean(
    currentConversation?.messages &&
      Array.isArray(currentConversation.messages) &&
      (currentConversation.messages as unknown[]).length > 0,
  );

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />

      {/* Header */}
      <div
        className={`px-4 pt-4 pb-3 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                AIdeal Assistant
              </h3>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                GPT 5.4 · En línea
              </p>
            </div>
          </div>

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${
                  darkMode
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              {AI_MODELS[selectedModel]}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showModelDropdown && (
              <div
                className={`
                  absolute top-full right-0 mt-1.5 border rounded-xl shadow-xl z-50 min-w-40 overflow-hidden
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
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
                      w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2 transition-colors
                      ${
                        selectedModel === key
                          ? darkMode
                            ? 'bg-blue-900/40 text-blue-400'
                            : 'bg-blue-50 text-blue-700'
                          : darkMode
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${selectedModel === key ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                    <span className="font-medium">{name}</span>
                    {key === 'gpt-5.4' && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'}`}
                      >
                        Pro
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all
              ${
                activeTab === 'analysis'
                  ? darkMode
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Análisis
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all
              ${
                activeTab === 'chat'
                  ? darkMode
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat IA
            {messages.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
              >
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'analysis' ? (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Conversation Status */}
            <ConversationStatusCard
              status={
                analysis
                  ? {
                      current_phase: (analysis.analysis_data as any)?.current_phase || 1,
                      phase_progress: (analysis.phase_progress || {}) as any,
                      sentiment_scores: (analysis.sentiment_scores || {
                        overall: 0,
                        by_message: [],
                      }) as any,
                      key_insights: (analysis.key_insights || []) as string[],
                      warnings: (analysis.warnings || []) as string[],
                      action_threads: (analysis.action_threads || []) as string[],
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

            {/* Message Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4
                  className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                >
                  Sugerencias de Respuesta
                </h4>
                <button
                  onClick={generateSuggestions}
                  disabled={isGeneratingSuggestions || !hasConversation}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${
                      isGeneratingSuggestions || !hasConversation
                        ? darkMode
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:shadow-md hover:shadow-blue-500/25 active:scale-95'
                    }
                  `}
                >
                  {isGeneratingSuggestions ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-3.5 h-3.5" />
                      Generar
                    </>
                  )}
                </button>
              </div>

              {isGeneratingSuggestions ? (
                <div
                  className={`p-6 rounded-xl border-2 border-dashed text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p
                    className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    Analizando conversación...
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    GPT 5.4 está generando respuestas personalizadas
                  </p>
                </div>
              ) : (
                <MessageSuggestions
                  suggestions={suggestions}
                  onCopy={handleCopyMessage}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onMarkAsUsed={handleMarkAsUsed}
                  darkMode={darkMode}
                  usedSuggestions={usedSuggestions}
                />
              )}
            </div>

            {/* Quick AI Actions */}
            {hasConversation && (
              <div
                className={`p-3 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
              >
                <p
                  className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  ACCIONES RÁPIDAS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isTyping}
                      className={`
                        flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-all text-left
                        ${
                          darkMode
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${isTyping ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                      `}
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* AI Chat */
          <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mb-4">
                    <Bot className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  </div>
                  <h4
                    className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}
                  >
                    Tu copiloto de ventas
                  </h4>
                  <p
                    className={`text-xs text-center mb-5 max-w-[200px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    Pregúntame sobre esta conversación o pide ayuda para cerrar el lead
                  </p>

                  {/* Quick prompt buttons */}
                  <div className="w-full space-y-2 px-2">
                    {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                      <button
                        key={label}
                        onClick={() => handleSendMessage(prompt)}
                        className={`
                          w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700/50 hover:border-gray-600'
                              : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }
                          active:scale-[0.98]
                        `}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}
                        >
                          <Icon className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                    >
                      {/* AI avatar */}
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      <div className="flex flex-col max-w-[85%]">
                        <div
                          className={`
                            px-3.5 py-2.5 text-sm leading-relaxed
                            ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md'
                                : message.isError
                                  ? (darkMode
                                      ? 'bg-red-900/30 text-red-300 border border-red-800/50'
                                      : 'bg-red-50 text-red-700 border border-red-200') +
                                    ' rounded-2xl rounded-bl-md'
                                  : (darkMode
                                      ? 'bg-gray-800 text-gray-100 border border-gray-700/50'
                                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm') +
                                    ' rounded-2xl rounded-bl-md'
                            }
                          `}
                        >
                          {message.isError && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Error</span>
                            </div>
                          )}
                          <MessageContent content={message.content} />
                        </div>

                        {/* Message actions */}
                        <div
                          className={`flex items-center gap-2 mt-1 ${message.role === 'user' ? 'justify-end' : 'justify-start ml-0.5'}`}
                        >
                          <span
                            className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {message.role === 'assistant' && !message.isError && (
                            <button
                              onClick={() => handleCopyAIMessage(message.content)}
                              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="Copiar respuesta"
                            >
                              <Copy
                                className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div
                        className={`
                          px-4 py-3 rounded-2xl rounded-bl-md
                          ${darkMode ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-200 shadow-sm'}
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.15s' }}
                          />
                          <div
                            className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"
                            style={{ animationDelay: '0.3s' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div
              className={`p-3 border-t ${darkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200 bg-white'}`}
            >
              {/* Clear chat button */}
              {messages.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleClearChat}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Trash2 className="w-3 h-3" />
                    Limpiar chat
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={keyPress}
                  placeholder={
                    hasConversation ? 'Pregunta sobre el lead...' : 'Selecciona una conversación...'
                  }
                  disabled={isTyping}
                  className={`
                    flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
                    ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-600'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white'
                    }
                    ${isTyping ? 'opacity-60' : ''}
                  `}
                  rows={1}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isTyping}
                  className={`
                    p-2.5 rounded-xl transition-all flex-shrink-0
                    ${
                      !input.trim() || isTyping
                        ? darkMode
                          ? 'bg-gray-800 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-95'
                    }
                  `}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p
                className={`text-[10px] mt-1.5 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
              >
                Enter para enviar · Shift+Enter para nueva línea
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
