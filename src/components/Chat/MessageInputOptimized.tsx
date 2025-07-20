import React, { memo, useCallback, useState, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface MessageInputOptimizedProps {
  darkMode: boolean;
  initialMessage: string;
  showAISuggestion: boolean;
  disabled?: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onToggleAISuggestion: () => void;
}

export const MessageInputOptimized: React.FC<MessageInputOptimizedProps> = memo(({
  darkMode,
  initialMessage,
  showAISuggestion,
  disabled = false,
  onMessageChange,
  onSendMessage,
  onToggleAISuggestion,
}) => {
  // Local state for input to prevent parent re-renders on every keystroke
  const [localMessage, setLocalMessage] = useState(initialMessage);
  
  // Sync with parent when initialMessage changes (e.g., after sending)
  useEffect(() => {
    setLocalMessage(initialMessage);
  }, [initialMessage]);

  // Update parent state on blur or when sending
  const handleBlur = useCallback(() => {
    if (localMessage !== initialMessage) {
      onMessageChange(localMessage);
    }
  }, [localMessage, initialMessage, onMessageChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onMessageChange(localMessage); // Ensure parent has latest value
      onSendMessage();
    }
  }, [localMessage, onMessageChange, onSendMessage]);

  const handleSend = useCallback(() => {
    onMessageChange(localMessage); // Ensure parent has latest value
    onSendMessage();
  }, [localMessage, onMessageChange, onSendMessage]);

  return (
    <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Input Area */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={localMessage}
            onChange={e => setLocalMessage(e.target.value)}
            onBlur={handleBlur}
            placeholder="Escribe tu mensaje..."
            disabled={disabled}
            className={`w-full px-4 py-3 pr-12 rounded-xl border resize-none transition-all ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-650 disabled:opacity-50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 disabled:opacity-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed`}
            rows={2}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={onToggleAISuggestion}
            className={`absolute right-3 top-3 p-1.5 rounded-lg transition-colors ${
              showAISuggestion
                ? 'text-purple-600 bg-purple-100'
                : darkMode
                  ? 'text-gray-400 hover:text-purple-400'
                  : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Sparkles size={18} />
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={!localMessage.trim() || disabled}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
});

MessageInputOptimized.displayName = 'MessageInputOptimized';