import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const fetchLeads = async ({ pageParam = 0 }) => {
  const pageSize = 50;
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return { data, count, nextPage: pageParam + 1 };
};

export const useLeadsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.flatMap(page => page.data).length;
      return lastPage.count && loadedCount < lastPage.count ? lastPage.nextPage : undefined;
    },
  });
};