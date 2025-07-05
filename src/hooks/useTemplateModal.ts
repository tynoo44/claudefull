import { useState } from 'react';
import { MessageTemplate } from '../lib/supabase';

export const useTemplateModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: '',
    tone: '',
    purpose: '',
    variables: [] as string[],
    is_favorite: false,
  });
  const [variableInput, setVariableInput] = useState('');

  const openCreateModal = () => {
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      content: '',
      category: '',
      tone: '',
      purpose: '',
      variables: [],
      is_favorite: false,
    });
    setVariableInput('');
    setShowModal(true);
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
      is_favorite: template.is_favorite || false,
    });
    setVariableInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setVariableInput('');
  };

  const updateTemplate = (field: string, value: any) => {
    setNewTemplate(prev => ({ ...prev, [field]: value }));
  };

  const addVariable = () => {
    if (variableInput.trim() && !newTemplate.variables.includes(variableInput.trim())) {
      setNewTemplate(prev => ({
        ...prev,
        variables: [...prev.variables, variableInput.trim()],
      }));
      setVariableInput('');
    }
  };

  const removeVariable = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  return {
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
  };
};
