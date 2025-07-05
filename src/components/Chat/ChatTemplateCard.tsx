import React from 'react';
import { Star, Copy, Plus, Sparkles } from 'lucide-react';
import { Template } from '@/types';

interface ChatTemplateCardProps {
  template: Template;
  darkMode: boolean;
  onInsert: (template: Template) => void;
  onAdaptWithAI: (template: Template) => void;
  onCopy: (template: Template) => void;
  onClick: (template: Template) => void;
}

export const ChatTemplateCard: React.FC<ChatTemplateCardProps> = ({
  template,
  darkMode,
  onInsert,
  onAdaptWithAI,
  onCopy,
  onClick,
}) => {
  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'formal':
        return darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-700';
      case 'casual':
        return darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700';
      case 'amigable':
        return darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
      case 'profesional':
        return darkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-700';
      case 'persuasivo':
        return darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700';
      default:
        return darkMode ? 'bg-gray-900/20 text-gray-400' : 'bg-gray-100 text-gray-700';
    }
  };


  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={() => onClick(template)}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
        darkMode
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-sm font-semibold line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {template.name}
            </h3>
            {template.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />}
          </div>
          
          <div className="flex items-center gap-1 flex-wrap">
            {template.category && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {template.category}
              </span>
            )}
            {template.tone && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getToneColor(template.tone)}`}>
                {template.tone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <p className={`text-xs leading-relaxed mb-4 line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {template.content.length > 100
          ? `${template.content.substring(0, 100)}...`
          : template.content}
      </p>

      {/* Stats */}
      <div className={`flex items-center justify-between text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <span>{template.uses} usos</span>
        <span>{template.conversionRate}% éxito</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => handleButtonClick(e, () => onInsert(template))}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Insertar
        </button>
        
        <button
          onClick={(e) => handleButtonClick(e, () => onAdaptWithAI(template))}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            darkMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Adapt AI
        </button>
        
        <button
          onClick={(e) => handleButtonClick(e, () => onCopy(template))}
          className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
            darkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};