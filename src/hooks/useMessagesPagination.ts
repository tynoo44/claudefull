import { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'Lead' | 'Setter';
  text: string;
  platform_message_id: string | null;
  created_at: string;
}

const MESSAGES_PER_PAGE = 50;

export const useMessagesPagination = (conversationId: string | null) => {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const realtimeSubscription = useRef<RealtimeChannel | null>(null);

  // Use infinite query for pagination
  const { data, error, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['messages', conversationId],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
        if (!conversationId) {
          return { messages: [], totalCount: 0, hasMore: false };
        }

        // For initial load, use optimized RPC
        if (pageParam === 0) {
          const { data, error } = await supabase.rpc('get_initial_messages', {
            p_conversation_id: conversationId,
            p_limit: MESSAGES_PER_PAGE,
          });

          if (error) throw error;

          const messages = data.map((row: any) => ({
            id: row.id,
            conversation_id: row.conversation_id,
            sender_type: row.sender_type,
            text: row.text,
            platform_message_id: row.platform_message_id,
            created_at: row.created_at,
          }));

          return {
            messages,
            totalCount: data[0]?.total_count || 0,
            hasMore: data[0]?.has_more || false,
          };
        }

        // For subsequent pages, use paginated RPC
        const { data, error } = await supabase.rpc('get_messages_paginated', {
          p_conversation_id: conversationId,
          p_limit: MESSAGES_PER_PAGE,
          p_offset: pageParam,
        });

        if (error) throw error;

        const messages = data.map((row: any) => ({
          id: row.id,
          conversation_id: row.conversation_id,
          sender_type: row.sender_type,
          text: row.text,
          platform_message_id: row.platform_message_id,
          created_at: row.created_at,
        }));

        const totalCount = data[0]?.total_count || 0;
        const hasMore = pageParam + MESSAGES_PER_PAGE < totalCount;

        return {
          messages,
          totalCount,
          hasMore,
        };
      },
      getNextPageParam: (lastPage: any, allPages: any[]) => {
        if (!lastPage.hasMore) return undefined;

        // Calculate offset based on all loaded messages
        const loadedCount = allPages.reduce(
          (sum: number, page: any) => sum + page.messages.length,
          0,
        );
        return loadedCount;
      },
      enabled: !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

  // Combine all pages into a single array
  useEffect(() => {
    if (data) {
      const messages = data.pages.flatMap((page: any) => page.messages);
      // Sort by created_at ascending for display
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setAllMessages(messages);
    }
  }, [data]);

  // Setup realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    // Cleanup existing subscription
    if (realtimeSubscription.current) {
      supabase.removeChannel(realtimeSubscription.current);
    }

    // Create new subscription
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const newMessage = payload.new as Message;

          // Add new message to the end of the list
          setAllMessages(prev => {
            // Check if message already exists (avoid duplicates)
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        },
      )
      .subscribe();

    realtimeSubscription.current = channel;

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [conversationId]);

  // Load more messages (for infinite scroll upwards)
  const loadMoreMessages = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get total count from first page
  const totalCount = (data?.pages[0] as any)?.totalCount || 0;

  return {
    messages: allMessages,
    isLoading,
    error,
    hasMore: hasNextPage || false,
    isFetchingNextPage,
    loadMoreMessages,
    totalCount,
    refetch,
  };
};
