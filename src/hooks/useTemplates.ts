import { useState, useEffect } from 'react';
import { SupabaseService, MessageTemplate } from '../lib/supabase';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await SupabaseService.getMessageTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (
    templateData: Partial<MessageTemplate>,
    isEdit = false,
    templateId?: string,
  ) => {
    try {
      if (isEdit && templateId) {
        await SupabaseService.updateMessageTemplate(templateId, templateData);
      } else {
        await SupabaseService.createMessageTemplate({
          ...templateData,
          category: templateData.category || null,
          is_favorite: templateData.is_favorite || false,
          usage_count: templateData.usage_count || 0,
        } as any);
      }
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await SupabaseService.deleteMessageTemplate(templateId);
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  };

  const toggleFavorite = async (templateId: string, isFavorite: boolean) => {
    try {
      await SupabaseService.updateMessageTemplate(templateId, { is_favorite: isFavorite });
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error updating favorite:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    saveTemplate,
    deleteTemplate,
    toggleFavorite,
    refresh: fetchTemplates,
  };
};
