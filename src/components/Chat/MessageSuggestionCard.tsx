import React, { useState } from 'react';
import { Copy, Check, Lightbulb, MessageSquare, Target, Zap } from 'lucide-react';

interface MessageSuggestion {
  id: string;
  type: 'direct' | 'exploratory' | 'creative';
  message: string;
  strategy: string;
  confidence: number;
  phase: number;
  reasoning: string;
}

interface MessageSuggestionCardProps {
  suggestion: MessageSuggestion;
  onCopy: (message: string) => void;
  onSaveAsTemplate: (message: string, strategy: string) => void;
  onMarkAsUsed?: (suggestionId: string) => void;
  darkMode?: boolean;
  isUsed?: boolean;
}

const typeConfig = {
  direct: {
    icon: Target,
    label: 'Directo',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    darkBg: 'bg-orange-900/20',
    border: 'border-orange-200',
    darkBorder: 'border-orange-800/30',
    accent: 'from-orange-500 to-red-500',
  },
  exploratory: {
    icon: Lightbulb,
    label: 'Explorar',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    darkBg: 'bg-amber-900/20',
    border: 'border-amber-200',
    darkBorder: 'border-amber-800/30',
    accent: 'from-amber-500 to-yellow-500',
  },
  creative: {
    icon: Zap,
    label: 'Creativo',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    darkBg: 'bg-violet-900/20',
    border: 'border-violet-200',
    darkBorder: 'border-violet-800/30',
    accent: 'from-violet-500 to-blue-500',
  },
};

export const MessageSuggestionCard: React.FC<MessageSuggestionCardProps> = ({
  suggestion,
  onCopy,
  onMarkAsUsed,
  darkMode = false,
  isUsed = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const config = typeConfig[suggestion.type] || typeConfig.direct;
  const Icon = config.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.message);
      onCopy(suggestion.message);
      setIsCopied(true);
      if (onMarkAsUsed) onMarkAsUsed(suggestion.id);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl transition-all duration-200 group
        ${
          isUsed
            ? darkMode
              ? 'opacity-60 bg-gray-800/50'
              : 'opacity-60 bg-gray-50'
            : darkMode
              ? 'bg-gray-800 border border-gray-700/50 hover:border-gray-600'
              : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Accent line on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.accent}`} />

      <div className="pl-4 pr-3 py-3">
        {/* Type badge + confidence */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`flex items-center gap-1.5 text-[11px] font-semibold ${darkMode ? config.color.replace('600', '400') : config.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </div>
          <div className="flex items-center gap-1.5">
            {isUsed && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}
              >
                Usado
              </span>
            )}
            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Message text */}
        <p
          className={`text-sm leading-relaxed mb-2.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
        >
          {suggestion.message}
        </p>

        {/* Strategy + Copy button */}
        <div className="flex items-end justify-between gap-2">
          <p
            className={`text-[11px] leading-snug flex-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          >
            {suggestion.strategy}
          </p>
          <button
            onClick={handleCopy}
            disabled={isCopied}
            className={`
              flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0
              ${
                isCopied
                  ? darkMode
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-green-100 text-green-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white'
              }
              active:scale-95
            `}
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {isCopied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Container for multiple suggestions
interface MessageSuggestionsProps {
  suggestions: MessageSuggestion[];
  onCopy: (message: string) => void;
  onSaveAsTemplate: (message: string, strategy: string) => void;
  onMarkAsUsed?: (suggestionId: string) => void;
  darkMode?: boolean;
  usedSuggestions?: string[];
  title?: string;
}

export const MessageSuggestions: React.FC<MessageSuggestionsProps> = ({
  suggestions,
  onCopy,
  onSaveAsTemplate,
  onMarkAsUsed,
  darkMode = false,
  usedSuggestions = [],
}) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div
        className={`
          p-6 rounded-xl border-2 border-dashed text-center
          ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}
        `}
      >
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Sin sugerencias aún
        </p>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          Pulsa "Generar" para obtener respuestas IA
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {suggestions.map(suggestion => (
        <MessageSuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onCopy={onCopy}
          onSaveAsTemplate={onSaveAsTemplate}
          onMarkAsUsed={onMarkAsUsed}
          darkMode={darkMode}
          isUsed={usedSuggestions.includes(suggestion.id)}
        />
      ))}
    </div>
  );
};
