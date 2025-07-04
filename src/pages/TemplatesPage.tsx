import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Plus, Star, Copy, Edit, Trash2, TrendingUp } from 'lucide-react';
import { SupabaseService, MessageTemplate } from '../lib/supabase';

interface TemplatesPageProps {
  darkMode: boolean;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ darkMode }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Añadir notificación
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
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
                    {template.is_favorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
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
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2">
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
      </div>
    </div>
  );
};