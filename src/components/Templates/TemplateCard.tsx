import React from 'react';
import { Star, Copy, Edit, Trash2, TrendingUp } from 'lucide-react';
import { MessageTemplate } from '../../lib/supabase';

interface TemplateCardProps {
  template: MessageTemplate;
  darkMode: boolean;
  onEdit: (template: MessageTemplate) => void;
  onDelete: (templateId: string) => void;
  onToggleFavorite: (templateId: string, isFavorite: boolean) => void;
  onCopy: (content: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  darkMode,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
}) => {
  const getToneColor = (tone: string | null) => {
    if (!tone) return '';
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

  const getPurposeIcon = (purpose: string | null) => {
    if (!purpose) return '💬';
    switch (purpose.toLowerCase()) {
      case 'saludo':
        return '👋';
      case 'seguimiento':
        return '📞';
      case 'cierre':
        return '🎯';
      case 'objeciones':
        return '🤝';
      case 'agenda':
        return '📅';
      case 'informacion':
        return 'ℹ️';
      default:
        return '💬';
    }
  };

  return (
    <div
      className={`p-6 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg ${
        darkMode
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {template.name}
            </h3>
            {template.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
          </div>

          <div className="flex items-center gap-2 mb-3">
            {template.category && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {template.category}
              </span>
            )}
            {template.tone && (
              <span className={`text-xs px-2 py-1 rounded-full ${getToneColor(template.tone)}`}>
                {template.tone}
              </span>
            )}
            {template.purpose && (
              <span
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{getPurposeIcon(template.purpose)}</span>
                {template.purpose}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(template.id, !template.is_favorite)}
            className={`p-2 rounded-lg transition-colors ${
              template.is_favorite
                ? 'text-yellow-500 hover:bg-yellow-500/10'
                : darkMode
                  ? 'text-gray-400 hover:text-yellow-500 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-yellow-500 hover:bg-gray-100'
            }`}
            title={template.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => onCopy(template.content)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
            }`}
            title="Copiar contenido"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(template)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700'
                : 'text-gray-500 hover:text-green-600 hover:bg-gray-100'
            }`}
            title="Editar template"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(template.id)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
            }`}
            title="Eliminar template"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {template.content.length > 150
          ? `${template.content.substring(0, 150)}...`
          : template.content}
      </p>

      {template.variables && template.variables.length > 0 && (
        <div className="mb-4">
          <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Variables disponibles:
          </p>
          <div className="flex flex-wrap gap-1">
            {template.variables.map((variable, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-0.5 rounded border ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        className={`flex items-center justify-between text-xs ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{template.usage_count || 0} usos</span>
          </div>
          {template.created_at && (
            <span>Creado: {new Date(template.created_at).toLocaleDateString('es-ES')}</span>
          )}
        </div>
        {template.last_used && (
          <span>Último uso: {new Date(template.last_used).toLocaleDateString('es-ES')}</span>
        )}
      </div>
    </div>
  );
};
