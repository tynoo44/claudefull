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

    // Should have hasMore if there are more pages
    expect(result.current.hasMore).toBe(true);

    // Load more messages
    result.current.loadMoreMessages();

    // Wait for next page to load
    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    // Should have more messages
    expect(result.current.messages.length).toBeGreaterThan(2);
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
    let conversationId = 'conv-1';

    const { result, rerender } = renderHook(() => useMessagesPagination(conversationId), {
      wrapper: createWrapper(),
    });

    // Wait for first conversation to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstMessages = result.current.messages;

    // Change conversation ID
    conversationId = 'conv-2';
    rerender();

    // Should start loading again
    expect(result.current.isLoading).toBe(true);

    // Wait for new conversation to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Messages should be different (or empty for new conversation)
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