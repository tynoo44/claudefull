import React from 'react';
import { X, Star, Copy, Edit, Trash2, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { Template } from '@/types';

interface ChatTemplateModalProps {
  template: Template | null;
  isOpen: boolean;
  darkMode: boolean;
  onClose: () => void;
  onInsert: (template: Template) => void;
  onAdaptWithAI: (template: Template) => void;
  onCopy: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
}

export const ChatTemplateModal: React.FC<ChatTemplateModalProps> = ({
  template,
  isOpen,
  darkMode,
  onClose,
  onInsert,
  onAdaptWithAI,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  if (!isOpen || !template) return null;

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


  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      onDelete(template);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className={`relative w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </h2>
              {template.isFavorite && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {template.category && (
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {template.category}
                </span>
              )}
              {template.tone && (
                <span className={`text-sm px-3 py-1 rounded-full ${getToneColor(template.tone)}`}>
                  {template.tone}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Template Content */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Contenido de la plantilla
            </h3>
            <div 
              className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-900 border-gray-700 text-gray-300' 
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {template.content}
              </p>
            </div>
          </div>

          {/* Variables */}
          {template.variables && template.variables.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Variables disponibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable, index) => (
                  <span
                    key={index}
                    className={`text-sm px-3 py-1 rounded-lg border ${
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

          {/* Stats */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Estadísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Usos
                  </span>
                </div>
                <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {template.uses}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tasa de éxito
                  </span>
                </div>
                <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {template.conversionRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Creation Date */}
          {template.created_at && (
            <div className="mb-6">
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Creado el {new Date(template.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(template)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                template.isFavorite
                  ? 'text-yellow-500 hover:bg-yellow-500/10'
                  : darkMode
                    ? 'text-gray-400 hover:text-yellow-500 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-yellow-500 hover:bg-gray-100'
              }`}
            >
              <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
              <span className="text-sm">
                {template.isFavorite ? 'Favorito' : 'Añadir a favoritos'}
              </span>
            </button>

            <button
              onClick={() => onEdit(template)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-green-600 hover:bg-gray-100'
              }`}
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm">Editar</span>
            </button>

            <button
              onClick={handleDelete}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Eliminar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopy(template)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copiar</span>
            </button>

            <button
              onClick={() => onAdaptWithAI(template)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Adaptar con IA</span>
            </button>

            <button
              onClick={() => onInsert(template)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Insertar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};