import React from 'react';
import { X, Plus } from 'lucide-react';
import { MessageTemplate } from '../../lib/supabase';

interface TemplateModalProps {
  darkMode: boolean;
  isOpen: boolean;
  editingTemplate: MessageTemplate | null;
  newTemplate: {
    name: string;
    content: string;
    category: string;
    tone: string;
    purpose: string;
    variables: string[];
    is_favorite: boolean;
  };
  variableInput: string;
  onClose: () => void;
  onTemplateChange: (field: string, value: any) => void;
  onVariableInputChange: (value: string) => void;
  onAddVariable: () => void;
  onRemoveVariable: (index: number) => void;
  onSave: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  darkMode,
  isOpen,
  editingTemplate,
  newTemplate,
  variableInput,
  onClose,
  onTemplateChange,
  onVariableInputChange,
  onAddVariable,
  onRemoveVariable,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl rounded-xl shadow-xl transition-all ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Nombre
            </label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={e => onTemplateChange('name', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Nombre del template"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Contenido
            </label>
            <textarea
              value={newTemplate.content}
              onChange={e => onTemplateChange('content', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Contenido del mensaje..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Categoría
              </label>
              <input
                type="text"
                value={newTemplate.category}
                onChange={e => onTemplateChange('category', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="Categoría"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Tono
              </label>
              <select
                value={newTemplate.tone}
                onChange={e => onTemplateChange('tone', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="">Seleccionar tono</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="amigable">Amigable</option>
                <option value="profesional">Profesional</option>
                <option value="persuasivo">Persuasivo</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Propósito
            </label>
            <select
              value={newTemplate.purpose}
              onChange={e => onTemplateChange('purpose', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">Seleccionar propósito</option>
              <option value="saludo">Saludo inicial</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="cierre">Cierre de venta</option>
              <option value="objeciones">Manejo de objeciones</option>
              <option value="agenda">Agendar cita</option>
              <option value="informacion">Información</option>
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Variables
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={variableInput}
                onChange={e => onVariableInputChange(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="Ej: nombre, empresa, producto"
                onKeyPress={e => e.key === 'Enter' && onAddVariable()}
              />
              <button
                onClick={onAddVariable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newTemplate.variables.map((variable, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {variable}
                  <button
                    onClick={() => onRemoveVariable(index)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_favorite"
              checked={newTemplate.is_favorite}
              onChange={e => onTemplateChange('is_favorite', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="is_favorite"
              className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Marcar como favorito
            </label>
          </div>
        </div>

        <div
          className={`flex justify-end gap-3 p-6 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
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
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingTemplate ? 'Actualizar' : 'Crear'} Template
          </button>
        </div>
      </div>
    </div>
  );
};
