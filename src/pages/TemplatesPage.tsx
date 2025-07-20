import React, { useState } from 'react';
import { TemplatesHeader, SortOption } from '../components/Templates/TemplatesHeader';
import { TemplateCard } from '../components/Templates/TemplateCard';
import { TemplateModal } from '../components/Templates/TemplateModal';
import { useTemplatesQuery } from '../hooks/useTemplatesQuery';
import { useQueryClient } from '@tanstack/react-query';
import { MessageTemplate, createMessageTemplate, updateMessageTemplate, deleteMessageTemplate } from '../lib/supabase';
import { Template } from '../types';

interface TemplatesPageProps {
  darkMode: boolean;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('mostUsed');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useTemplatesQuery();
  const queryClient = useQueryClient();

  const categories = [
    'all',
    ...new Set((data?.pages.flatMap(page => page.data) || []).map(t => t.category).filter(Boolean) as string[]),
  ];

  const allTemplates = data?.pages.flatMap(page => page.data) || [];

  const sortTemplates = (templates: MessageTemplate[]) => {
    return [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'mostUsed':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'leastUsed':
          return (a.usage_count || 0) - (b.usage_count || 0);
        case 'successRate':
          return (b.conversion_rate || 0) - (a.conversion_rate || 0);
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
    allTemplates.filter(template => {
      if (!template) return false;
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || template.is_favorite;
      return matchesSearch && matchesCategory && matchesFavorites;
    }),
  );

  const convertToTemplate = (msgTemplate: MessageTemplate): Template => ({
    id: msgTemplate.id,
    name: msgTemplate.name,
    content: msgTemplate.content,
    category: msgTemplate.category || '',
    tone: msgTemplate.tone || '',
    variables: msgTemplate.variables || [],
    uses: msgTemplate.usage_count || 0,
    conversionRate: msgTemplate.conversion_rate || 0,
    isFavorite: msgTemplate.is_favorite || false,
    created_at: msgTemplate.created_at,
    updated_at: msgTemplate.updated_at,
  });

  const convertToMessageTemplate = (template: Template): Partial<MessageTemplate> => ({
    id: template.id,
    name: template.name,
    content: template.content,
    category: template.category,
    tone: template.tone,
    variables: template.variables,
    is_favorite: template.isFavorite,
  });

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsCreateMode(true);
    setShowModal(true);
  };

  const handleTemplateClick = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsCreateMode(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setIsCreateMode(false);
  };

  const handleTemplateSave = async (template: Template) => {
    const messageTemplate = convertToMessageTemplate(template);
    if (isCreateMode) {
      await createMessageTemplate(messageTemplate as any);
    } else {
      await updateMessageTemplate(template.id, messageTemplate);
    }
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    handleModalClose();
    return true;
  };

  const handleTemplateDelete = async (template: Template) => {
    await deleteMessageTemplate(template.id);
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    handleModalClose();
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleToggleFavorite = async (template: Template) => {
    await updateMessageTemplate(template.id, { is_favorite: !template.isFavorite });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };

  if (status === 'pending') {
    return (
      <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className={`transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <TemplatesHeader
          darkMode={darkMode}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          templatesCount={filteredTemplates.length}
          sortBy={sortBy}
          showFavoritesOnly={showFavoritesOnly}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortBy}
          onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
          onCreateNew={handleCreateNew}
        />
      </div>

      <div className="p-6">
        {filteredTemplates.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="text-lg mb-2">
              {searchTerm || selectedCategory !== 'all'
                ? 'No se encontraron templates con los filtros aplicados'
                : 'No hay templates disponibles'}
            </p>
            <p className="text-sm">
              {!searchTerm && selectedCategory === 'all' && (
                <>
                  Crea tu primer template para comenzar{' '}
                  <button
                    onClick={handleCreateNew}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    haciendo clic aquí
                  </button>
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={convertToTemplate(template)}
                  darkMode={darkMode}
                  onClick={() => handleTemplateClick(template)}
                  onCopy={handleCopyTemplate}
                />
              ))}
            </div>
            {hasNextPage && (
              <div className="text-center mt-6">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Cargando...' : 'Cargar más plantillas'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <TemplateModal
        template={selectedTemplate ? convertToTemplate(selectedTemplate) : null}
        isOpen={showModal}
        darkMode={darkMode}
        onClose={handleModalClose}
        onSave={handleTemplateSave}
        onCopy={handleCopyTemplate}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleTemplateDelete}
      />
    </div>
  );
};
