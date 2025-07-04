import React, { useState } from 'react';
import { Search, Star, Copy, FileText } from 'lucide-react';
import { Template } from '@/types';

interface TemplatesSidebarProps {
  darkMode: boolean;
  templates: Template[];
  selectedTemplate: Template | null;
  onTemplateInsert: (template: Template) => void;
}

export const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({
  darkMode,
  templates,
  selectedTemplate,
  onTemplateInsert
}) => {
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const categories = ['Todas', ...new Set(templates.map(t => t.category).filter(Boolean))];
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                         template.content.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`w-80 border-l flex flex-col ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Plantillas
          </h3>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Templates List */}
      <div className="overflow-y-auto flex-1">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`p-4 border-b cursor-pointer transition-colors ${
              selectedTemplate?.id === template.id
                ? (darkMode ? 'bg-blue-900/30 border-gray-600' : 'bg-blue-50 border-gray-200')
                : (darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200')
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </h4>
              <div className="flex items-center space-x-1">
                {template.isFavorite && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(template.content);
                  }}
                  className={`p-1 rounded transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {template.content.length > 100 
                ? `${template.content.substring(0, 100)}...` 
                : template.content
              }
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {template.category}
              </span>
              <button
                onClick={() => onTemplateInsert(template)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Insertar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};