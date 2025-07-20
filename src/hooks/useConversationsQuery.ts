import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ConversationWithLastMessage } from '../types';

interface ConversationOptimized {
  id: string;
  lead_id: string;
  opened_at: string;
  updated_at: string;
  current_phase: number;
  qualification_score: any;
  last_message_text: string | null;
  last_message_created_at: string | null;
  last_message_sender_type: string | null;
  unread_count: number;
  lead_username: string;
  lead_full_name: string | null;
  lead_profile_pic: string | null;
  lead_status: string;
  lead_instagram_id: string;
}

const fetchConversations = async ({ pageParam = 0 }) => {
  const pageSize = 50;
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .rpc('get_conversations_with_details_optimized')
    .range(from, to);

  if (error) {
    console.error('Error fetching conversations:', error);
    throw new Error(`Error al cargar conversaciones: ${error.message}`);
  }

  // Transform the optimized data to match the expected format
  const transformedData: ConversationWithLastMessage[] = (data as ConversationOptimized[]).map(conv => ({
    id: conv.id,
    lead_id: conv.lead_id,
    opened_at: conv.opened_at,
    updated_at: conv.updated_at,
    last_message_text: conv.last_message_text,
    last_message_created_at: conv.last_message_created_at,
    last_message_sender_type: conv.last_message_sender_type as 'Lead' | 'Setter' | null,
    leads: {
      id: conv.lead_id,
      username: conv.lead_username || '',
      full_name: conv.lead_full_name,
      profile_pic: conv.lead_profile_pic,
      status: conv.lead_status || 'Open',
      tags: conv.lead_tags || [],
      notes: conv.lead_notes,
      followers_count: conv.lead_followers_count,
    },
    unreadCount: conv.unread_count,
  }));

  return { 
    data: transformedData, 
    count: count || 0, 
    nextPage: pageParam + 1 
  };
};

export const useConversationsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.flatMap(page => page.data).length;
      return lastPage.count && loadedCount < lastPage.count ? lastPage.nextPage : undefined;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};