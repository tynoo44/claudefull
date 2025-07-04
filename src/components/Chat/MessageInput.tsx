import React from 'react';
import { Send, Sparkles } from 'lucide-react';

interface MessageInputProps {
  darkMode: boolean;
  message: string;
  showAISuggestion: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onToggleAISuggestion: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  darkMode,
  message,
  showAISuggestion,
  onMessageChange,
  onSendMessage,
  onToggleAISuggestion
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* AI Suggestion */}
      {showAISuggestion && (
        <div className={`mb-3 p-3 rounded-lg border-l-4 border-purple-500 ${
          darkMode ? 'bg-purple-900/20' : 'bg-purple-50'
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
              onMessageChange("Perfecto! Me parece genial que estés interesado. ¿Te parece si agendamos una llamada rápida para explicarte mejor los detalles?");
              onToggleAISuggestion();
            }}
            className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Usar esta respuesta
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className={`w-full px-4 py-3 pr-12 rounded-xl border resize-none transition-all ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-650' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            rows={2}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={onToggleAISuggestion}
            className={`absolute right-3 top-3 p-1.5 rounded-lg transition-colors ${
              showAISuggestion 
                ? 'text-purple-600 bg-purple-100' 
                : (darkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600')
            }`}
          >
            <Sparkles size={18} />
          </button>
        </div>
        <button
          onClick={onSendMessage}
          disabled={!message.trim()}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};