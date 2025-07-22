import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface TagWithCount {
  tag: string;
  usage_count: number;
}

export const useAllTags = () => {
  return useQuery<TagWithCount[]>({
    queryKey: ['allTags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_unique_tags');

      if (error) throw error;

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
