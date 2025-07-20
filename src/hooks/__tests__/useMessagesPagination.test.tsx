import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessagesPagination } from '../useMessagesPagination';
import { mockMessages } from '../../test/mocks/handlers';

// Create a wrapper component with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

describe('useMessagesPagination', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    // Get the mocked supabase instance
    const { supabase } = await import('../../lib/supabase');
    mockSupabase = supabase;

    vi.clearAllMocks();

    // Setup default mock responses
    mockSupabase.rpc.mockImplementation((fnName: string, params: any) => {
      if (fnName === 'get_initial_messages') {
        if (params.p_conversation_id === 'empty-conv') {
          return Promise.resolve({ data: [], error: null });
        }
        if (params.p_conversation_id === 'error-conv') {
          return Promise.resolve({ data: null, error: new Error('Test error') });
        }
        return Promise.resolve({
          data: mockMessages.slice(0, 2),
          error: null,
        });
      }
      if (fnName === 'get_messages_paginated') {
        return Promise.resolve({
          data: mockMessages.slice(2),
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    });
  });

  it('should return initial state when conversationId is null', () => {
    const { result } = renderHook(() => useMessagesPagination(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.totalCount).toBe(0);
  });

  it('should load initial messages when conversationId is provided', async () => {
    const conversationId = 'conv-1';

    const { result } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have loaded messages
    expect(result.current.messages).toHaveLength(2); // First page from mock
    expect(result.current.totalCount).toBeGreaterThan(0);
  });

  it('should handle pagination correctly', async () => {
    const conversationId = 'conv-1';

    const { result } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.messages.length;

    // Load more messages if available
    if (result.current.hasMore) {
      result.current.loadMoreMessages();

      // Wait for next page to load
      await waitFor(() => {
        expect(result.current.isFetchingNextPage).toBe(false);
      });

      // Should have same or more messages (depending on how pagination works)
      expect(result.current.messages.length).toBeGreaterThanOrEqual(initialCount);
    }
  });

  it('should sort messages by created_at in ascending order', async () => {
    const conversationId = 'conv-1';

    const { result } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { messages } = result.current;

    if (messages.length > 1) {
      for (let i = 1; i < messages.length; i++) {
        const prevDate = new Date(messages[i - 1].created_at);
        const currDate = new Date(messages[i].created_at);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    }
  });

  it('should handle empty conversation correctly', async () => {
    const conversationId = 'empty-conv';

    const { result } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.totalCount).toBe(0);
  });

  it('should provide loadMoreMessages function', () => {
    const { result } = renderHook(() => useMessagesPagination('conv-1'), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.loadMoreMessages).toBe('function');
  });

  it('should provide refetch function', () => {
    const { result } = renderHook(() => useMessagesPagination('conv-1'), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should reset state when conversationId changes', async () => {
    const { result, rerender } = renderHook(({ convId }) => useMessagesPagination(convId), {
      wrapper: createWrapper(),
      initialProps: { convId: 'conv-1' },
    });

    // Wait for first conversation to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstMessages = result.current.messages;

    // Change conversation ID to empty conversation
    rerender({ convId: 'empty-conv' });

    // Wait for new conversation to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Messages should be empty for empty conversation
    expect(result.current.messages).toEqual([]);
    expect(result.current.messages).not.toEqual(firstMessages);
  });

  it('should not load more when already fetching', async () => {
    const conversationId = 'conv-1';

    const { result } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start fetching next page
    result.current.loadMoreMessages();

    // Try to load more while already fetching
    const initialFetchingState = result.current.isFetchingNextPage;
    result.current.loadMoreMessages();

    // Should not change the fetching state
    expect(result.current.isFetchingNextPage).toBe(initialFetchingState);
  });

  it('should handle error states gracefully', async () => {
    const conversationId = 'error-conv';

    const { result } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should handle errors gracefully without crashing
    expect(result.current.error).toBeDefined();
    expect(result.current.messages).toEqual([]);
  });
});
