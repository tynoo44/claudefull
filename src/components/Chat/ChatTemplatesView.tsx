import React, { useState } from 'react';
import { Search, Star, FileText, Plus } from 'lucide-react';
import { Template } from '@/types';
import { TemplateCard } from '../Templates/TemplateCard';
import { TemplateModal } from '../Templates/TemplateModal';

interface ChatTemplatesViewProps {
  darkMode: boolean;
  templates: Template[];
  onTemplateInsert: (template: Template) => void;
  onTemplateDelete: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
  onCreateNew?: (template: Template) => void;
}

type SortOption = 'mostUsed' | 'leastUsed' | 'successRate' | 'alphabetical' | 'recent';

export const ChatTemplatesView: React.FC<ChatTemplatesViewProps> = ({
  darkMode,
  templates,
  onTemplateInsert,
  onTemplateDelete,
  onToggleFavorite,
  onCreateNew,
}) => {
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState<SortOption>('mostUsed');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);

  const categories = ['Todas', ...new Set(templates.map(t => t.category).filter(Boolean))];

  const handleAdaptWithAI = (template: Template) => {
    // Create a modified version of the template to insert
    const adaptedContent = `[Adaptando con IA el siguiente mensaje]\n\n${template.content}\n\n[Por favor, personaliza este mensaje según el contexto de la conversación]`;
    const adaptedTemplate = { ...template, content: adaptedContent };
    onTemplateInsert(adaptedTemplate);
    handleModalClose();
  };

  const handleCopy = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      // Simple visual feedback - could be enhanced with a toast notification
      // For now, the copy is silent but successful
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const [isCreateMode, setIsCreateMode] = useState(false);

  const handleSave = async (template: Template) => {
    try {
      if (isCreateMode && onCreateNew) {
        onCreateNew(template);
        setIsCreateMode(false);
      }
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsCreateMode(true);
    setShowModal(true);
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setIsCreateMode(false);
  };

  const handleModalInsert = (template: Template) => {
    onTemplateInsert(template);
    handleModalClose();
  };

  const handleModalDelete = (template: Template) => {
    onTemplateDelete(template);
    handleModalClose();
  };

  const sortTemplates = (templates: Template[]) => {
    return [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'mostUsed':
          return b.uses - a.uses;
        case 'leastUsed':
          return a.uses - b.uses;
        case 'successRate':
          return b.conversionRate - a.conversionRate;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });
  };

  const filteredTemplates = sortTemplates(
    templates.filter(template => {
      const matchesSearch =
        template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        template.content.toLowerCase().includes(templateSearch.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || template.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || template.isFavorite;
      return matchesSearch && matchesCategory && matchesFavorites;
    }),
  );

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Plantillas
            </h3>
          </div>
          {onCreateNew && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Filters - Compact single row */}
        <div className="flex items-center gap-1 mb-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={`flex-1 min-w-0 px-2 py-1.5 text-sm rounded border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className={`flex-1 min-w-0 px-2 py-1.5 text-sm rounded border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="mostUsed">Más usado</option>
            <option value="leastUsed">Menos usado</option>
            <option value="successRate">Tasa éxito</option>
            <option value="alphabetical">A-Z</option>
            <option value="recent">Reciente</option>
          </select>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex-shrink-0 p-1.5 rounded border transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-500 border-yellow-500 text-white'
                : darkMode
                  ? 'border-gray-600 text-gray-400 hover:text-yellow-500 hover:border-yellow-500'
                  : 'border-gray-300 text-gray-500 hover:text-yellow-500 hover:border-yellow-500'
            }`}
            title={showFavoritesOnly ? 'Mostrar todas' : 'Solo favoritos'}
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {templateSearch || selectedCategory !== 'Todas' || showFavoritesOnly
                ? 'No se encontraron plantillas'
                : 'No hay plantillas disponibles'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                darkMode={darkMode}
                onClick={() => handleTemplateClick(template)}
                onInsert={onTemplateInsert}
                onCopy={handleCopy}
                onAdaptWithAI={handleAdaptWithAI}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <TemplateModal
        template={selectedTemplate}
        isOpen={showModal}
        darkMode={darkMode}
        onClose={handleModalClose}
        onSave={handleSave}
        onInsert={handleModalInsert}
        onAdaptWithAI={handleAdaptWithAI}
        onCopy={handleCopy}
        onToggleFavorite={onToggleFavorite}
        onDelete={handleModalDelete}
      />
    </div>
  );
};
