import React, { useState } from 'react';
import { Search, Star, FileText } from 'lucide-react';
import { Template } from '@/types';
import { ChatTemplateCard } from './ChatTemplateCard';
import { ChatTemplateModal } from './ChatTemplateModal';

interface ChatTemplatesViewProps {
  darkMode: boolean;
  templates: Template[];
  onTemplateInsert: (template: Template) => void;
  onTemplateEdit: (template: Template) => void;
  onTemplateDelete: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
}

type SortOption = 'mostUsed' | 'leastUsed' | 'successRate' | 'alphabetical' | 'recent';

export const ChatTemplatesView: React.FC<ChatTemplatesViewProps> = ({
  darkMode,
  templates,
  onTemplateInsert,
  onTemplateEdit,
  onTemplateDelete,
  onToggleFavorite,
}) => {
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState<SortOption>('mostUsed');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);

  const categories = ['Todas', ...new Set(templates.map(t => t.category).filter(Boolean))];

  const handleAdaptWithAI = (template: Template) => {
    // TODO: Implement AI adaptation logic
    console.log('Adapting template with AI:', template);
  };

  const handleCopy = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      // TODO: Show success notification
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTemplate(null);
  };

  const handleModalInsert = (template: Template) => {
    onTemplateInsert(template);
    handleModalClose();
  };

  const handleModalEdit = (template: Template) => {
    onTemplateEdit(template);
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
      const matchesCategory = selectedCategory === 'Todas' || template.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || template.isFavorite;
      return matchesSearch && matchesCategory && matchesFavorites;
    })
  );


  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <FileText className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Plantillas
          </h3>
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

        {/* Filters */}
        <div className="flex items-center gap-2 mb-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
            className={`flex-1 px-3 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="mostUsed">Más usado</option>
            <option value="leastUsed">Menos usado</option>
            <option value="successRate">Tasa de éxito</option>
            <option value="alphabetical">Alfabético</option>
            <option value="recent">Más reciente</option>
          </select>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-2 rounded-lg border transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-500 border-yellow-500 text-white'
                : darkMode
                  ? 'border-gray-600 text-gray-400 hover:text-yellow-500 hover:border-yellow-500'
                  : 'border-gray-300 text-gray-500 hover:text-yellow-500 hover:border-yellow-500'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <ChatTemplateCard
                key={template.id}
                template={template}
                darkMode={darkMode}
                onInsert={onTemplateInsert}
                onAdaptWithAI={handleAdaptWithAI}
                onCopy={handleCopy}
                onClick={handleTemplateClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ChatTemplateModal
        template={selectedTemplate}
        isOpen={showModal}
        darkMode={darkMode}
        onClose={handleModalClose}
        onInsert={handleModalInsert}
        onAdaptWithAI={handleAdaptWithAI}
        onCopy={handleCopy}
        onEdit={handleModalEdit}
        onDelete={handleModalDelete}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
};