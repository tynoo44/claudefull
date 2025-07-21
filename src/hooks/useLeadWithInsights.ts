import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface LeadInsights {
  id: string;
  lead_id: string;
  business_info: {
    type?: string;
    details?: string;
    youtube_status?: string;
    budget_signals?: string;
  };
  pain_points: string[];
  goals: string[];
  obstacles: string[];
  personality_profile: {
    type?: string;
    commitment?: string;
    red_flags?: string[];
  };
  communication_preferences: {
    style?: string;
  };
  auto_tags: string[];
  confidence_score: number;
}

interface LeadWithInsights {
  id: string;
  username: string;
  full_name?: string;
  tags: string[];
  notes?: string;
  status: string;
  current_phase?: number;
  insights?: LeadInsights;
}

export function useLeadWithInsights(leadId?: string) {
  return useQuery({
    queryKey: ['lead-with-insights', leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const { data, error } = await supabase
        .from('leads')
        .select(
          `
          *,
          lead_insights (*)
        `,
        )
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('Error fetching lead with insights:', error);
        throw error;
      }

      return data as LeadWithInsights;
    },
    enabled: !!leadId,
    staleTime: 30000, // 30 seconds
  });
}
