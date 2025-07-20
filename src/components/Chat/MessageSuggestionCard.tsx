import React, { useState } from 'react';
import { Copy, Save, Check, AlertCircle, Lightbulb, MessageSquare, Target } from 'lucide-react';

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

export const MessageSuggestionCard: React.FC<MessageSuggestionCardProps> = ({
  suggestion,
  onCopy,
  onSaveAsTemplate,
  onMarkAsUsed,
  darkMode = false,
  isUsed = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showFullReasoning, setShowFullReasoning] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.message);
      onCopy(suggestion.message);
      setIsCopied(true);
      
      // Marcar como usado si se proporciona la función
      if (onMarkAsUsed) {
        onMarkAsUsed(suggestion.id);
      }
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleSaveTemplate = () => {
    onSaveAsTemplate(suggestion.message, suggestion.strategy);
  };

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'direct':
        return <Target className="w-4 h-4" />;
      case 'exploratory':
        return <Lightbulb className="w-4 h-4" />;
      case 'creative':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (suggestion.type) {
      case 'direct':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'exploratory':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'creative':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeName = () => {
    switch (suggestion.type) {
      case 'direct':
        return 'Directo';
      case 'exploratory':
        return 'Exploratorio';
      case 'creative':
        return 'Creativo';
      default:
        return 'General';
    }
  };

  const getConfidenceBar = () => {
    const percentage = Math.round(suggestion.confidence * 100);
    const color = percentage >= 80 ? 'bg-green-500' : 
                  percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Confianza:</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-gray-600 font-medium">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className={`
      relative overflow-hidden rounded-lg border transition-all duration-200 
      ${isUsed ? 'opacity-75 bg-gray-50' : 'bg-white hover:shadow-md hover:border-blue-300'}
      ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'}
    `}>
      {/* Indicador de usado */}
      {isUsed && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Check className="w-3 h-3" />
          Usado
        </div>
      )}

      {/* Header con tipo y confianza */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor()}`}>
            {getTypeIcon()}
            {getTypeName()}
          </div>
          <div className="text-xs text-gray-500">
            Fase {suggestion.phase}
          </div>
        </div>
        
        {getConfidenceBar()}
      </div>

      {/* Mensaje sugerido */}
      <div className="px-3 pb-2">
        <div className={`
          p-3 rounded-lg text-sm leading-relaxed
          ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-50 text-gray-800'}
        `}>
          "{suggestion.message}"
        </div>
      </div>

      {/* Estrategia */}
      <div className="px-3 pb-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-blue-600 mb-1">ESTRATEGIA</div>
            <div className="text-xs text-gray-600">
              {suggestion.strategy}
            </div>
          </div>
        </div>
      </div>

      {/* Razonamiento expandible */}
      {suggestion.reasoning && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowFullReasoning(!showFullReasoning)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showFullReasoning ? 'Ocultar' : 'Ver'} razonamiento
          </button>
          
          {showFullReasoning && (
            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
              {suggestion.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-2 p-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleCopy}
          disabled={isCopied}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all
            ${isCopied 
              ? 'bg-green-100 text-green-800 cursor-default' 
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
            }
          `}
        >
          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {isCopied ? 'Copiado' : 'Copiar'}
        </button>

        <button
          onClick={handleSaveTemplate}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium 
                   border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
        >
          <Save className="w-3 h-3" />
          Guardar
        </button>

        {/* Indicador de calidad */}
        <div className="ml-auto flex items-center gap-1">
          {suggestion.confidence >= 0.8 && (
            <div className="w-2 h-2 rounded-full bg-green-500" title="Alta calidad" />
          )}
          {suggestion.confidence >= 0.6 && suggestion.confidence < 0.8 && (
            <div className="w-2 h-2 rounded-full bg-yellow-500" title="Calidad media" />
          )}
          {suggestion.confidence < 0.6 && (
            <div className="w-2 h-2 rounded-full bg-red-500" title="Revisar sugerencia" />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente contenedor para múltiples sugerencias
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
  title = "Sugerencias de Respuesta"
}) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className={`
        p-4 rounded-lg border-2 border-dashed text-center
        ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}
      `}>
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay sugerencias disponibles</p>
        <p className="text-xs mt-1">Solicita análisis de la conversación</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {title}
        </h3>
        <div className="text-xs text-gray-500">
          {suggestions.length} opciones
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
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
    </div>
  );
};