import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// interface TagData {
//   tag: string;
//   count: number;
// } // Unused

export function useTags() {
  const queryClient = useQueryClient();

  // Fetch all unique tags from leads
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('tags').not('tags', 'is', null);

      if (error) throw error;

      // Extract unique tags and count occurrences
      const tagMap = new Map<string, number>();
      data?.forEach(lead => {
        lead.tags?.forEach((tag: string) => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Add tag to a lead
  const addTag = useMutation({
    mutationFn: async ({ leadId, tag }: { leadId: string; tag: string }) => {
      const { error } = await supabase.rpc('add_tag', {
        p_lead_id: leadId,
        p_tag_name: tag,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Remove tag from a lead
  const removeTag = useMutation({
    mutationFn: async ({ leadId, tag }: { leadId: string; tag: string }) => {
      const { error } = await supabase.rpc('remove_tag', {
        p_lead_id: leadId,
        p_tag_name: tag,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    tags,
    isLoading,
    addTag: addTag.mutate,
    removeTag: removeTag.mutate,
    isAddingTag: addTag.isPending,
    isRemovingTag: removeTag.isPending,
  };
}

// Hook for filtering by selected tags
export function useTagFilter() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearTags = () => setSelectedTags([]);

  return {
    selectedTags,
    toggleTag,
    clearTags,
    hasFilters: selectedTags.length > 0,
  };
}
