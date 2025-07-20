import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../lib/supabase';

export const useDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });
};
