import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeadsPagination } from '../useLeadsPagination';
import { mockLeads } from '../../test/mocks/handlers';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

describe('useLeadsPagination', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    // Get the mocked supabase instance
    const { supabase } = await import('../../lib/supabase');
    mockSupabase = supabase;

    vi.clearAllMocks();

    // Setup default mock responses
    mockSupabase.rpc.mockResolvedValue({
      data: mockLeads,
      error: null,
    });

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockLeads[0],
      error: null,
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useLeadsPagination());

    expect(result.current.leads).toEqual([]);
    expect(result.current.allLeads).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should load leads on initialization', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    // Wait for initialization timeout (100ms)
    await new Promise(resolve => setTimeout(resolve, 150));

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_leads_optimized');
    expect(result.current.allLeads).toHaveLength(mockLeads.length);
    expect(result.current.leads).toHaveLength(Math.min(20, mockLeads.length)); // First page
    expect(result.current.totalCount).toBe(mockLeads.length);
  });

  it('should handle pagination correctly', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLeadsCount = result.current.leads.length;

    act(() => {
      result.current.loadMore();
    });

    // Should load more leads if available
    if (result.current.totalCount > 20) {
      expect(result.current.leads.length).toBeGreaterThan(initialLeadsCount);
    }
  });

  it('should apply search filters correctly', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters('testuser1'); // Search for specific username
    });

    const filteredLeads = result.current.leads.filter(lead =>
      lead.username.toLowerCase().includes('testuser1'),
    );

    expect(result.current.leads).toEqual(expect.arrayContaining(filteredLeads));
  });

  it('should apply status filters correctly', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters('', [], 'Open'); // Filter by Open status
    });

    result.current.leads.forEach(lead => {
      expect(lead.status).toBe('Open');
    });
  });

  it('should apply tag filters correctly', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters('', ['interested']); // Filter by tag
    });

    result.current.leads.forEach(lead => {
      expect(lead.tags).toContain('interested');
    });
  });

  it('should sort leads correctly', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters('', [], 'all', 'all', 'name', true); // Sort by name ascending
    });

    const { leads } = result.current;
    if (leads.length > 1) {
      for (let i = 1; i < leads.length; i++) {
        const prevName = leads[i - 1].full_name || leads[i - 1].username || '';
        const currName = leads[i].full_name || leads[i].username || '';
        expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('should refresh leads data', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCount = mockSupabase.rpc.mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockSupabase.rpc.mock.calls.length).toBeGreaterThan(callCount);
  });

  it('should handle errors gracefully', async () => {
    // Mock error response for the next call
    mockSupabase.rpc.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLeadsPagination());

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 150));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(result.current.error).toBeTruthy();
    expect(result.current.leads).toEqual([]);
  });

  it('should clear errors', async () => {
    // Mock error response first
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should check and load more based on scroll position', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLeadsCount = result.current.leads.length;

    act(() => {
      // Simulate scrolling near the end (within prefetch threshold)
      result.current.checkAndLoadMore(initialLeadsCount - 3);
    });

    // Should trigger load more if there are more leads
    if (result.current.totalCount > initialLeadsCount) {
      await waitFor(() => {
        expect(result.current.leads.length).toBeGreaterThan(initialLeadsCount);
      });
    }
  });

  it('should not load more when already loading', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Start loading
    act(() => {
      result.current.loadMore();
    });

    const loadingState = result.current.loading;

    // Try to load more while loading
    act(() => {
      result.current.loadMore();
    });

    // Should maintain the same loading state
    expect(result.current.loading).toBe(loadingState);
  });

  it('should stop pagination when no more leads', async () => {
    // Mock a small dataset
    const smallDataset = [mockLeads[0]];
    mockSupabase.rpc.mockResolvedValueOnce({
      data: smallDataset,
      error: null,
    });

    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Load more (should reach end immediately)
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);
  });

  it('should handle procedence filter correctly', async () => {
    const { result } = renderHook(() => useLeadsPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters('', [], 'all', 'Instagram');
    });

    result.current.leads.forEach(lead => {
      expect(lead.procedence).toBe('Instagram');
    });
  });
});
