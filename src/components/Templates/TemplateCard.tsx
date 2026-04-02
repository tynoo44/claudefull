import React from 'react';
import { Star, Hash, TrendingUp, Copy, FileText } from 'lucide-react';
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
  Formal: { light: 'bg-blue-50 text-blue-600', dark: 'bg-blue-900/20 text-blue-400' },
  Casual: { light: 'bg-green-50 text-green-600', dark: 'bg-green-900/20 text-green-400' },
  Amigable: {
    light: 'bg-amber-50 text-amber-600',
    dark: 'bg-amber-900/20 text-amber-400',
  },
  Profesional: {
    light: 'bg-purple-50 text-purple-600',
    dark: 'bg-purple-900/20 text-purple-400',
  },
  Persuasivo: { light: 'bg-red-50 text-red-600', dark: 'bg-red-900/20 text-red-400' },
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  darkMode,
  onClick,
  onCopy,
}) => {
  const handleActionClick = (e: React.MouseEvent, action: (template: Template) => void) => {
    e.stopPropagation();
    action(template);
  };

  const getToneColorClass = (tone: string) => {
    const colors = TONE_COLORS[tone as keyof typeof TONE_COLORS];
    return colors
      ? darkMode
        ? colors.dark
        : colors.light
      : darkMode
        ? 'bg-gray-700/50 text-gray-300'
        : 'bg-gray-100 text-gray-600';
  };

  return (
    <div
      onClick={onClick}
      className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col h-full ${
        darkMode
          ? 'bg-gray-800/60 border-gray-700/60 hover:border-gray-600 hover:bg-gray-800/80'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}
          >
            <FileText className={`w-4.5 h-4.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4
              className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {template.name}
            </h4>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {template.category || 'Sin categoria'}
            </p>
          </div>
        </div>
        {template.isFavorite && (
          <Star className="w-4 h-4 text-amber-400 fill-current flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Tone badge */}
      {template.tone && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getToneColorClass(
              template.tone,
            )}`}
          >
            {template.tone}
          </span>
        </div>
      )}

      {/* Content preview */}
      <p
        className={`text-xs mb-3 line-clamp-3 flex-grow leading-relaxed ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        {template.content}
      </p>

      {/* Variables */}
      {template.variables && template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {template.variables.slice(0, 3).map((variable, index) => (
            <span
              key={index}
              className={`text-xs px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Hash className="w-2.5 h-2.5" />
              {variable}
            </span>
          ))}
          {template.variables.length > 3 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md ${
                darkMode ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400'
              }`}
            >
              +{template.variables.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className={`flex items-center justify-between text-xs mt-auto pt-3 border-t ${
          darkMode ? 'border-gray-700/50' : 'border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          >
            <TrendingUp className="w-3 h-3" />
            {template.uses} usos
          </span>
          {template.conversionRate > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                template.conversionRate >= 50
                  ? darkMode
                    ? 'bg-emerald-900/20 text-emerald-400'
                    : 'bg-emerald-50 text-emerald-600'
                  : darkMode
                    ? 'bg-gray-700/50 text-gray-400'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {template.conversionRate}%
            </span>
          )}
        </div>
        {onCopy && (
          <button
            onClick={e => handleActionClick(e, onCopy)}
            className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
              darkMode
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title="Copiar contenido"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
