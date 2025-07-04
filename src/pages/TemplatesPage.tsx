import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Plus, Star, Copy, Edit, Trash2, TrendingUp, X } from 'lucide-react';
import { SupabaseService, MessageTemplate } from '../lib/supabase';

interface TemplatesPageProps {
  darkMode: boolean;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ darkMode }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: '',
    tone: '',
    purpose: '',
    variables: [] as string[],
    is_favorite: false
  });
  const [variableInput, setVariableInput] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await SupabaseService.getMessageTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean) as string[])];
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('¡Plantilla copiada al portapapeles!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleAddTemplate = async () => {
    try {
      const templateData = {
        name: newTemplate.name,
        content: newTemplate.content,
        category: newTemplate.category || null,
        tone: newTemplate.tone || null,
        purpose: newTemplate.purpose || null,
        variables: newTemplate.variables.length > 0 ? newTemplate.variables : null,
        is_favorite: newTemplate.is_favorite,
        usage_count: 0,
        conversion_rate: null,
        is_favorited: newTemplate.is_favorite,
        usage_stats: null
      };
      
      const createdTemplate = await SupabaseService.createMessageTemplate(templateData);
      setTemplates(prev => [createdTemplate, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error al crear la plantilla');
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      const templateData = {
        name: newTemplate.name,
        content: newTemplate.content,
        category: newTemplate.category || null,
        tone: newTemplate.tone || null,
        purpose: newTemplate.purpose || null,
        variables: newTemplate.variables.length > 0 ? newTemplate.variables : null,
        is_favorite: newTemplate.is_favorite,
        is_favorited: newTemplate.is_favorite
      };
      
      const updatedTemplate = await SupabaseService.updateMessageTemplate(editingTemplate.id, templateData);
      setTemplates(prev => prev.map(template => template.id === editingTemplate.id ? updatedTemplate : template));
      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error al actualizar la plantilla');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) return;
    
    try {
      await SupabaseService.deleteMessageTemplate(templateId);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar la plantilla');
    }
  };

  const toggleFavorite = async (template: MessageTemplate) => {
    try {
      const updatedTemplate = await SupabaseService.updateMessageTemplate(template.id, {
        is_favorite: !template.is_favorite,
        is_favorited: !template.is_favorite
      });
      setTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t));
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const openEditModal = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      content: template.content,
      category: template.category || '',
      tone: template.tone || '',
      purpose: template.purpose || '',
      variables: template.variables || [],
      is_favorite: template.is_favorite || false
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setNewTemplate({
      name: '',
      content: '',
      category: '',
      tone: '',
      purpose: '',
      variables: [],
      is_favorite: false
    });
    setVariableInput('');
  };

  const addVariable = () => {
    if (variableInput.trim() && !newTemplate.variables.includes(variableInput.trim())) {
      setNewTemplate(prev => ({ ...prev, variables: [...prev.variables, variableInput.trim()] }));
      setVariableInput('');
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setNewTemplate(prev => ({ ...prev, variables: prev.variables.filter(variable => variable !== variableToRemove) }));
  };

  const useTemplateInChat = async (template: MessageTemplate) => {
    try {
      await SupabaseService.incrementTemplateUsage(template.id);
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: (t.usage_count || 0) + 1 }
          : t
      ));
      await copyToClipboard(template.content);
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-48 mb-4`}></div>
            <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-64 mb-8`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <MessageSquare className="inline-block mr-3 h-8 w-8" />
                Plantillas de Mensajes
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total de plantillas: {templates.length}
              </p>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-3 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Buscar plantillas por nombre o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="lg:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full py-2 px-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Todas las categorías' : (category || 'Sin categoría')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Plantillas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border rounded-lg p-6 hover:shadow-lg transition-shadow`}
            >
              {/* Header de la Plantilla */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {template.name}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(template)}
                      className={`p-1 rounded ${
                        template.is_favorite 
                          ? 'text-yellow-500' 
                          : darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-500 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${template.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  {template.category && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      darkMode 
                        ? 'bg-blue-900 text-blue-200' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {template.category}
                    </span>
                  )}
                </div>

                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => copyToClipboard(template.content)}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    title="Copiar plantilla"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    title="Editar plantilla"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' 
                        : 'hover:bg-gray-100 text-red-500 hover:text-red-700'
                    }`}
                    title="Eliminar plantilla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contenido de la Plantilla */}
              <div className="mb-4">
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                } border-l-4 border-blue-500`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {template.content.length > 200 
                      ? `${template.content.substring(0, 200)}...` 
                      : template.content
                    }
                  </p>
                </div>
              </div>

              {/* Metadatos */}
              <div className="space-y-2 text-sm">
                {template.tone && (
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tono:</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{template.tone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Usos:</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {template.usage_count || 0}
                    </span>
                  </div>
                </div>

                {template.conversion_rate !== null && template.conversion_rate > 0 && (
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Conversión:</span>
                    <span className={`font-medium ${
                      template.conversion_rate > 0.5 ? 'text-green-500' : 
                      template.conversion_rate > 0.3 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {(template.conversion_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Creada:</span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {new Date(template.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Variables */}
              {template.variables && template.variables.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Variables disponibles:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable, index) => (
                      <span
                        key={index}
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => useTemplateInChat(template)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Usar en Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No se encontraron plantillas</p>
            <p>Intenta ajustar los filtros de búsqueda o crea una nueva plantilla</p>
          </div>
        )}

        {/* Modal para Agregar/Editar Plantilla */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre de la Plantilla *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                    placeholder="Nombre descriptivo para la plantilla"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contenido *
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                    rows={6}
                    placeholder="Escribe el contenido del mensaje aquí..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500`}
                      placeholder="Ej: Apertura, Seguimiento, Cierre"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tono
                    </label>
                    <input
                      type="text"
                      value={newTemplate.tone}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, tone: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500`}
                      placeholder="Ej: Amigable, Directo, Profesional"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Propósito
                  </label>
                  <input
                    type="text"
                    value={newTemplate.purpose}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, purpose: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                    placeholder="Describe el propósito de esta plantilla"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Variables
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={variableInput}
                      onChange={(e) => setVariableInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500`}
                      placeholder="Agregar variable (ej: {nombre}, {empresa})"
                    />
                    <button
                      type="button"
                      onClick={addVariable}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newTemplate.variables.map((variable, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {variable}
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="ml-1 hover:bg-blue-200 rounded-full"
                        >
                          <X className="h-3 w-3" />
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
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, is_favorite: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_favorite" className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Marcar como favorita
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={editingTemplate ? handleEditTemplate : handleAddTemplate}
                  disabled={!newTemplate.name.trim() || !newTemplate.content.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTemplate ? 'Actualizar' : 'Crear Plantilla'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};