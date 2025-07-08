import { useState, useEffect } from 'react';
import { SupabaseService, MessageTemplate } from '../lib/supabase';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 50;

export const useTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchTemplates = async (append = false) => {
    try {
      setLoading(true);

      const from = append ? templates.length : 0;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('message_templates')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newTemplates = data || [];

      if (append) {
        setTemplates(prev => [...prev, ...newTemplates]);
      } else {
        setTemplates(newTemplates);
      }

      setTotalCount(count || 0);
      setHasMore(
        (append ? templates.length + newTemplates.length : newTemplates.length) < (count || 0),
      );
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchTemplates(true);
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
      await fetchTemplates(false);
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await SupabaseService.deleteMessageTemplate(templateId);
      await fetchTemplates(false);
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  };

  const toggleFavorite = async (templateId: string, isFavorite: boolean) => {
    try {
      await SupabaseService.updateMessageTemplate(templateId, { is_favorite: isFavorite });
      await fetchTemplates(false);
      return true;
    } catch (error) {
      console.error('Error updating favorite:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates(false);
  }, []);

  return {
    templates,
    loading,
    totalCount,
    hasMore,
    saveTemplate,
    deleteTemplate,
    toggleFavorite,
    refresh: () => fetchTemplates(false),
    loadMore,
  };
};
