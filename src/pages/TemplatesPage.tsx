import React, { useState } from 'react';
import { TemplatesHeader } from '../components/Templates/TemplatesHeader';
import { TemplateCard } from '../components/Templates/TemplateCard';
import { TemplateModal } from '../components/Templates/TemplateModal';
import { useTemplates } from '../hooks/useTemplates';
import { useTemplateModal } from '../hooks/useTemplateModal';

interface TemplatesPageProps {
  darkMode: boolean;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { templates, loading, saveTemplate, deleteTemplate, toggleFavorite } = useTemplates();

  const {
    showModal,
    editingTemplate,
    newTemplate,
    variableInput,
    openCreateModal,
    openEditModal,
    closeModal,
    updateTemplate,
    setVariableInput,
    addVariable,
    removeVariable,
  } = useTemplateModal();

  const categories = [
    'all',
    ...new Set(templates.map(t => t.category).filter(Boolean) as string[]),
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveTemplate = async () => {
    const success = await saveTemplate(newTemplate, !!editingTemplate, editingTemplate?.id);
    if (success) {
      closeModal();
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este template?')) {
      await deleteTemplate(templateId);
    }
  };

  const handleCopyTemplate = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Aquí podrías agregar una notificación de éxito
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (loading) {
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
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <TemplatesHeader
          darkMode={darkMode}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          templatesCount={filteredTemplates.length}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onCreateNew={openCreateModal}
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
              {!searchTerm && selectedCategory === 'all' && 'Crea tu primer template para comenzar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                darkMode={darkMode}
                onEdit={openEditModal}
                onDelete={handleDeleteTemplate}
                onToggleFavorite={toggleFavorite}
                onCopy={handleCopyTemplate}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateModal
        darkMode={darkMode}
        isOpen={showModal}
        editingTemplate={editingTemplate}
        newTemplate={newTemplate}
        variableInput={variableInput}
        onClose={closeModal}
        onTemplateChange={updateTemplate}
        onVariableInputChange={setVariableInput}
        onAddVariable={addVariable}
        onRemoveVariable={removeVariable}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};
