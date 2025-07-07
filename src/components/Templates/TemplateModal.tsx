import React, { useState, useEffect } from 'react';
import { X, Star, Copy, Plus, Sparkles, MessageSquare, Save, TrendingUp } from 'lucide-react';
import { Template } from '@/types';

interface TemplateModalProps {
  template: Template | null;
  isOpen: boolean;
  darkMode: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  onInsert?: (template: Template) => void;
  onAdaptWithAI?: (template: Template) => void;
  onCopy?: (template: Template) => void;
  onToggleFavorite?: (template: Template) => void | Promise<void>;
  onDelete?: (template: Template) => void;
}

const TONE_OPTIONS = ['Formal', 'Casual', 'Amigable', 'Profesional', 'Persuasivo'];
const CATEGORY_OPTIONS = ['Saludo', 'Seguimiento', 'Cierre', 'Objeciones', 'Agenda', 'Información'];

export const TemplateModal: React.FC<TemplateModalProps> = ({
  template,
  isOpen,
  darkMode,
  onClose,
  onSave,
  onInsert,
  onAdaptWithAI,
  onCopy,
  onToggleFavorite,
  onDelete,
}) => {
  const [editedTemplate, setEditedTemplate] = useState<Template | null>(null);
  const [variableInput, setVariableInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setEditedTemplate({ ...template });
      } else {
        setEditedTemplate({
          id: '',
          name: '',
          content: '',
          category: '',
          tone: '',
          variables: [],
          uses: 0,
          conversionRate: 0,
          isFavorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      setEditedTemplate(null);
    }
  }, [isOpen, template]);

  if (!isOpen || !editedTemplate) return null;

  const handleSave = () => {
    if (editedTemplate) {
      onSave(editedTemplate);
    }
  };

  const handleCopy = async () => {
    if (template && onCopy) {
      try {
        await navigator.clipboard.writeText(template.content);
        onCopy(template);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleDelete = () => {
    if (editedTemplate && onDelete) {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
        onDelete(editedTemplate);
      }
    }
  };

  const addVariable = () => {
    if (variableInput.trim() && editedTemplate) {
      const newVariables = [...(editedTemplate.variables || []), variableInput.trim()];
      setEditedTemplate({ ...editedTemplate, variables: newVariables });
      setVariableInput('');
    }
  };

  const removeVariable = (index: number) => {
    if (editedTemplate) {
      const newVariables = editedTemplate.variables?.filter((_, i) => i !== index) || [];
      setEditedTemplate({ ...editedTemplate, variables: newVariables });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ring-2 ${
                darkMode ? 'bg-gray-700 ring-gray-800' : 'bg-gray-200 ring-white'
              }`}
            >
              <MessageSquare
                className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {template?.name || 'Sin nombre'}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {template?.category || 'Sin categoría'}
              </p>
            </div>
            {template?.isFavorite && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Edit Form */}
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={editedTemplate.name}
                  onChange={e => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Contenido
                </label>
                <textarea
                  value={editedTemplate.content}
                  onChange={e => setEditedTemplate({ ...editedTemplate, content: e.target.value })}
                  rows={6}
                  className={`w-full px-3 py-2 rounded-lg border resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    Categoría
                  </label>
                  <select
                    value={editedTemplate.category || ''}
                    onChange={e =>
                      setEditedTemplate({ ...editedTemplate, category: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Seleccionar...</option>
                    {CATEGORY_OPTIONS.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    Tono
                  </label>
                  <select
                    value={editedTemplate.tone || ''}
                    onChange={e => setEditedTemplate({ ...editedTemplate, tone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Seleccionar...</option>
                    {TONE_OPTIONS.map(tone => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Variables
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={e => setVariableInput(e.target.value)}
                    placeholder="Añadir variable..."
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onKeyPress={e => e.key === 'Enter' && addVariable()}
                  />
                  <button
                    onClick={addVariable}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedTemplate.variables?.map((variable, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {variable}
                      <button onClick={() => removeVariable(index)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Stats and Actions */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3
                  className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Estadísticas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp
                        className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Usos
                      </span>
                    </div>
                    <p
                      className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {template?.uses || 0}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tasa de éxito
                      </span>
                    </div>
                    <p
                      className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {template?.conversionRate || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3
                  className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  Acciones rápidas
                </h3>
                <div className="space-y-2">
                  {onInsert && (
                    <button
                      onClick={() => {
                        onInsert(editedTemplate);
                        onClose();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Insertar en chat
                    </button>
                  )}

                  {onAdaptWithAI && (
                    <button
                      onClick={() => {
                        onAdaptWithAI(editedTemplate);
                        onClose();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Adaptar con IA
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar contenido
                  </button>
                </div>
              </div>

              {template?.created_at && (
                <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Creado el {new Date(template.created_at).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={async () => {
                  await onToggleFavorite(editedTemplate);
                  // Update local state to reflect the change
                  setEditedTemplate({ ...editedTemplate, isFavorite: !editedTemplate.isFavorite });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  editedTemplate.isFavorite
                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                    : darkMode
                      ? 'text-gray-400 hover:text-yellow-500 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-yellow-500 hover:bg-gray-100'
                }`}
              >
                <Star className={`w-4 h-4 ${editedTemplate.isFavorite ? 'fill-current' : ''}`} />
                <span className="text-sm">
                  {editedTemplate.isFavorite ? 'Favorito' : 'Añadir a favoritos'}
                </span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Eliminar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
