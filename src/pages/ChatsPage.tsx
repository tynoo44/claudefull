import React, { useState } from 'react';
import { Send, Sparkles, Search, Star, Copy } from 'lucide-react';
import { Chat, Template } from '@/types';
import { sampleMessages } from '@/data/sampleData';

interface ChatsPageProps {
  darkMode: boolean;
  chats: Chat[];
  templates: Template[];
  selectedChat: Chat | null;
  selectedTemplate: Template | null;
  message: string;
  showAISuggestion: boolean;
  selectChat: (chat: Chat) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setMessage: (message: string) => void;
  setShowAISuggestion: (show: boolean) => void;
}

export const ChatsPage: React.FC<ChatsPageProps> = ({
  darkMode,
  chats,
  templates,
  selectedChat,
  selectedTemplate,
  message,
  showAISuggestion,
  selectChat,
  setSelectedTemplate,
  setMessage,
  setShowAISuggestion
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Get messages for selected chat
  const chatMessages = selectedChat 
    ? sampleMessages.filter(msg => msg.chatId === selectedChat.id)
    : [];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                         template.content.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todas', 'Apertura', 'Seguimiento', 'Objeciones', 'Cierre'];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // Here you would typically add the message to the chat
    console.log('Sending message:', message);
    setMessage('');
    setShowAISuggestion(false);
  };

  const insertTemplate = (template: Template) => {
    setMessage(template.content);
    setSelectedTemplate(template);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen pt-16">
        {/* Chat List - Left Column */}
        <div className={`w-80 border-r ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conversaciones
            </h2>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Buscar chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id
                    ? (darkMode ? 'bg-blue-900 border-gray-600' : 'bg-blue-50 border-gray-200')
                    : (darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200')
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm">{chat.avatar}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
                      chat.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    } ${darkMode ? 'border-gray-800' : 'border-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium truncate ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {chat.leadName}
                      </h3>
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {chat.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {chat.lastMessage}
                      </p>
                      {chat.unread && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages - Center Column */}
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm">{selectedChat.avatar}</span>
                  </div>
                  <div>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedChat.leadName}
                    </h3>
                    <p className={`text-sm ${
                      selectedChat.status === 'online' ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {selectedChat.status === 'online' ? 'En línea' : 'Desconectado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Suggestion */}
              {showAISuggestion && (
                <div className={`mx-4 mb-2 p-3 rounded-lg border-l-4 border-purple-500 ${
                  darkMode ? 'bg-purple-900 bg-opacity-20' : 'bg-purple-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      Sugerencia de IA
                    </span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Perfecto! Me parece genial que estés interesado. ¿Te parece si agendamos una llamada rápida para explicarte mejor los detalles?
                  </p>
                  <button
                    onClick={() => {
                      setMessage("Perfecto! Me parece genial que estés interesado. ¿Te parece si agendamos una llamada rápida para explicarte mejor los detalles?");
                      setShowAISuggestion(false);
                    }}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Usar esta respuesta
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className={`w-full px-4 py-2 pr-12 rounded-lg border resize-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={() => setShowAISuggestion(!showAISuggestion)}
                      className={`absolute right-2 top-2 p-1 rounded transition-colors ${
                        showAISuggestion 
                          ? 'text-purple-600 bg-purple-100' 
                          : (darkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600')
                      }`}
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                  💬
                </div>
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Selecciona una conversación
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Elige un chat de la lista para comenzar a conversar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Templates - Right Column */}
        <div className={`w-80 border-l ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Plantillas
            </h3>
            
            {/* Template Search */}
            <div className="relative mb-3">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Templates List */}
          <div className="overflow-y-auto flex-1">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? (darkMode ? 'bg-blue-900 border-gray-600' : 'bg-blue-50 border-gray-200')
                    : (darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200')
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {template.name}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {template.isFavorite && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(template.content)}
                      className={`p-1 rounded transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {template.content.length > 100 
                    ? `${template.content.substring(0, 100)}...` 
                    : template.content
                  }
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.category}
                  </span>
                  <button
                    onClick={() => insertTemplate(template)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Insertar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};