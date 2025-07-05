import React, { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, MessageSquare, TrendingUp, Lightbulb, ChevronDown } from 'lucide-react';
import { generateAIResponse, generateQuickActions, GEMINI_MODELS, type GeminiModel } from '../../lib/gemini';
import { MessageContent } from './MessageContent';

interface AIChatSidebarProps {
  darkMode: boolean;
  conversationContext?: string;
  currentConversation?: any; // Replace with actual conversation type
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ 
  darkMode, 
  conversationContext,
  currentConversation 
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente personal IA. Puedo ayudarte con cualquier pregunta o tarea.\n\nMi especialidad es el **appointment setting**, por lo que puedo:\n\n📊 **Analizar** conversaciones con leads\n💡 **Sugerir** mensajes basados en scripts\n📈 **Identificar** fases de venta\n🎯 **Asesorar** en estrategias\n\nPero también puedo ayudarte con cualquier otra consulta. ¿En qué puedo asistirte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.5-flash');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

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
      // Build conversation context if available
      let fullContext = conversationContext || '';
      if (currentConversation?.messages && currentConversation.messages.length > 0) {
        const conversationMessages = currentConversation.messages.map((msg: any) => 
          `${msg.sender_type === 'Setter' ? 'Setter' : 'Lead'}: ${msg.text || msg.content || ''}`
        ).join('\n');
        fullContext = `Conversación actual con ${currentConversation.leadName || currentConversation.full_name || currentConversation.username || 'lead'}:\n${conversationMessages}`;
      }

      const response = await generateAIResponse({
        messages: messages.concat(userMessage),
        model: selectedModel,
        conversationContext: fullContext
      });

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Error al procesar tu solicitud. Verifica tu conexión o intenta con otro modelo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: 'summarize' | 'phase' | 'suggest') => {
    // Debug logging
    console.log('Current conversation:', currentConversation);
    console.log('Messages in conversation:', currentConversation?.messages);
    
    if (!currentConversation || !currentConversation.id) {
      const noConversationMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ No hay ninguna conversación abierta. Abre un chat con un lead para que pueda analizarlo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, noConversationMessage]);
      return;
    }

    setIsTyping(true);
    
    // Convert current conversation to AI messages format
    const conversationMessages: AIMessage[] = currentConversation?.messages?.map((msg: any) => ({
      role: msg.sender_type === 'Setter' ? 'assistant' : 'user',
      content: msg.text || msg.content || ''
    })) || [];

    if (!currentConversation.messages || conversationMessages.length === 0) {
      const emptyConversationMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '📭 Esta conversación no tiene mensajes aún. Empieza a chatear con el lead para que pueda ayudarte.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, emptyConversationMessage]);
      setIsTyping(false);
      return;
    }

    try {
      let response = '';
      let actionMessage = '';
      
      switch (action) {
        case 'summarize':
          actionMessage = '📊 Analizando la conversación con ' + (currentConversation.leadName || 'el lead') + '...';
          response = await generateQuickActions.summarizeConversation(conversationMessages, selectedModel);
          break;
        case 'phase':
          actionMessage = '📈 Identificando fase de venta actual...';
          response = await generateQuickActions.analyzeSalesPhase(conversationMessages, selectedModel);
          break;
        case 'suggest':
          actionMessage = '💡 Generando sugerencias basadas en el script...';
          response = await generateQuickActions.suggestMessages(conversationMessages, selectedModel);
          break;
      }

      const systemMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: actionMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Error al analizar la conversación. Verifica tu conexión o intenta con otro modelo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`h-full border-l flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <Bot className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Asistente IA - Quantum
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Experto en appointment setting
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Limpiar chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Model Selector */}
        <div className="mt-3 relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100'
            } transition-colors`}
          >
            <span className="text-sm">{GEMINI_MODELS[selectedModel]}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showModelDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-10 ${
              darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
            }`}>
              {Object.entries(GEMINI_MODELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedModel(key as GeminiModel);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-opacity-10 hover:bg-purple-500 ${
                    selectedModel === key ? 'bg-purple-500 bg-opacity-10' : ''
                  } ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickAction('summarize')}
            disabled={isTyping}
            className={`p-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Resumen</span>
          </button>
          <button
            onClick={() => handleQuickAction('phase')}
            disabled={isTyping}
            className={`p-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Fase venta</span>
          </button>
          <button
            onClick={() => handleQuickAction('suggest')}
            disabled={isTyping}
            className={`p-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Sugerir</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Asistente Quantum
                  </span>
                </div>
              )}
              {message.role === 'system' && (
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sistema
                  </span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : message.role === 'system'
                    ? darkMode
                      ? 'bg-yellow-900/20 text-yellow-200 border border-yellow-800'
                      : 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                    : darkMode
                      ? 'bg-gray-700 text-white border border-gray-600'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <MessageContent 
                  content={message.content} 
                  className={`text-sm ${
                    message.role === 'user' ? 'text-white' : ''
                  }`}
                />
              </div>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                } ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {currentConversation && messages.length === 1 && (
          <div className={`px-4 py-3 rounded-lg mx-4 mb-4 ${
            darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className="text-sm">
              💬 <strong>Tip:</strong> Tengo acceso a la conversación con {currentConversation.leadName || currentConversation.username || 'el lead'}. 
              Usa los botones rápidos arriba para analizar la conversación.
            </p>
          </div>
        )}
        {isTyping && (
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-500" />
            <div className={`px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu pregunta o solicitud..."
            className={`flex-1 px-3 py-2 rounded-lg border resize-none ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            rows={2}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Powered by {GEMINI_MODELS[selectedModel]} • Contexto Quantum Creators
          </p>
        </div>
      </div>
    </div>
  );
};