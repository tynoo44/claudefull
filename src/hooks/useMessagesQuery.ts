import { useQuery } from '@tanstack/react-query';
import { getMessagesForConversation } from '../lib/supabase-functions';

export const useMessagesQuery = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      if (!conversationId) {
        return Promise.resolve([]);
      }
      return getMessagesForConversation(conversationId);
    },
    enabled: !!conversationId, // Only run the query if conversationId is not null
  });
};