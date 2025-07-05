import React from 'react';
import { Star, MessageSquare, Hash, TrendingUp, Copy, Plus, Sparkles } from 'lucide-react';
import { Template } from '@/types';

interface TemplateCardProps {
  template: Template;
  darkMode: boolean;
  onClick: () => void;
  onInsert?: (template: Template) => void;
  onCopy?: (template: Template) => void;
  onAdaptWithAI?: (template: Template) => void;
}

const TONE_COLORS = {
  Formal: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  Casual: { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  Amigable: { light: 'bg-yellow-100 text-yellow-700', dark: 'bg-yellow-900/30 text-yellow-400' },
  Profesional: { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  Persuasivo: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
};

const PURPOSE_ICONS = {
  saludo: '👋',
  seguimiento: '📞',
  cierre: '🎯',
  objeciones: '🤝',
  agenda: '📅',
  informacion: 'ℹ️',
  default: '💬',
};

export const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  darkMode, 
  onClick, 
  onInsert, 
  onCopy, 
  onAdaptWithAI 
}) => {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const getToneColorClass = (tone: string) => {
    const normalizedTone = tone.charAt(0).toUpperCase() + tone.slice(1).toLowerCase();
    const colors = TONE_COLORS[normalizedTone as keyof typeof TONE_COLORS];
    return colors ? (darkMode ? colors.dark : colors.light) : 
           (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  const getPurposeIcon = (purpose?: string) => {
    if (!purpose) return PURPOSE_ICONS.default;
    return PURPOSE_ICONS[purpose.toLowerCase() as keyof typeof PURPOSE_ICONS] || PURPOSE_ICONS.default;
  };

  return (
    <div
      className={`kanban-card p-4 rounded-lg border transition-all cursor-pointer group hover:shadow-lg hover:scale-[1.02] active:scale-95 ${
        darkMode
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header with Icon and Name */}
      <div className="flex items-start justify-between mb-3" onClick={onClick}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${
              darkMode ? 'bg-gray-700 ring-gray-800' : 'bg-gray-200 ring-white'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4
              className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {template.name}
            </h4>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {template.category || 'Sin categoría'}
            </p>
          </div>
        </div>
        {template.isFavorite && (
          <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
        )}
      </div>

      {/* Tone Badge */}
      {template.tone && (
        <div className="mb-3" onClick={onClick}>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getToneColorClass(template.tone)}`}
          >
            <span>{getPurposeIcon(template.tone)}</span>
            {template.tone}
          </span>
        </div>
      )}

      {/* Content Preview */}
      <div onClick={onClick}>
        <p className={`text-xs mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {template.content}
        </p>
      </div>

      {/* Variables Tags */}
      {template.variables && template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3" onClick={onClick}>
          {template.variables.slice(0, 2).map((variable, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Hash className="w-3 h-3" />
              {variable}
            </span>
          ))}
          {template.variables.length > 2 && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              +{template.variables.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Stats Badge */}
      <div className="mb-3" onClick={onClick}>
        <span
          className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 w-fit ${
            darkMode 
              ? 'bg-gray-900/50 border-gray-600 text-gray-400'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          {template.uses} usos • {template.conversionRate}% éxito
        </span>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {onInsert && (
          <button
            onClick={(e) => handleActionClick(e, () => onInsert(template))}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Insertar en chat"
          >
            <Plus className="w-3 h-3" />
            Insertar
          </button>
        )}
        
        {onAdaptWithAI && (
          <button
            onClick={(e) => handleActionClick(e, () => onAdaptWithAI(template))}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title="Adaptar con IA"
          >
            <Sparkles className="w-3 h-3" />
            Adaptar
          </button>
        )}
        
        {onCopy && (
          <button
            onClick={(e) => handleActionClick(e, () => onCopy(template))}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title="Copiar contenido"
          >
            <Copy className="w-3 h-3" />
            Copiar
          </button>
        )}
      </div>
    </div>
  );
};