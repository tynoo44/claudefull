import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeadsVirtualization } from '../useLeadsVirtualization';
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

describe('useLeadsVirtualization', () => {
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
    const { result } = renderHook(() => useLeadsVirtualization());

    expect(result.current.allLeads).toEqual([]);
    expect(result.current.filteredLeads).toEqual([]);
    expect(result.current.leadsByStatus).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.filteredCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should load all leads on initialization', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

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
    expect(result.current.filteredLeads).toHaveLength(mockLeads.length);
    expect(result.current.totalCount).toBe(mockLeads.length);
    expect(result.current.filteredCount).toBe(mockLeads.length);
  });

  it('should group leads by status correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 150));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    const { leadsByStatus } = result.current;

    // Check that leads are grouped by status
    Object.entries(leadsByStatus).forEach(([status, leads]) => {
      leads.forEach(lead => {
        expect(lead.status || 'Open').toBe(status);
      });
    });

    // Check that all statuses from mock data are present
    const expectedStatuses = [...new Set(mockLeads.map(lead => lead.status || 'Open'))];
    expectedStatuses.forEach(status => {
      expect(leadsByStatus[status]).toBeDefined();
    });
  });

  it('should apply search filters correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        searchTerm: 'testuser1',
      });
    });

    const { filteredLeads } = result.current;
    filteredLeads.forEach(lead => {
      const matchesSearch =
        lead.username.toLowerCase().includes('testuser1') ||
        lead.full_name?.toLowerCase().includes('testuser1') ||
        lead.notes?.toLowerCase().includes('testuser1') ||
        lead.tags?.some(tag => tag.toLowerCase().includes('testuser1'));

      expect(matchesSearch).toBe(true);
    });
  });

  it('should apply status filters correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        statusFilter: 'Open',
      });
    });

    const { filteredLeads } = result.current;
    filteredLeads.forEach(lead => {
      expect(lead.status || 'Open').toBe('Open');
    });
  });

  it('should apply tag filters correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        selectedTags: ['interested'],
      });
    });

    const { filteredLeads } = result.current;
    filteredLeads.forEach(lead => {
      expect(lead.tags).toContain('interested');
    });
  });

  it('should apply procedence filters correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        procedenceFilter: 'Instagram',
      });
    });

    const { filteredLeads } = result.current;
    filteredLeads.forEach(lead => {
      expect(lead.procedence).toBe('Instagram');
    });
  });

  it('should sort leads by name correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        sortBy: 'name',
        sortAscending: true,
      });
    });

    const { filteredLeads } = result.current;
    if (filteredLeads.length > 1) {
      for (let i = 1; i < filteredLeads.length; i++) {
        const prevName = filteredLeads[i - 1].full_name || filteredLeads[i - 1].username || '';
        const currName = filteredLeads[i].full_name || filteredLeads[i].username || '';
        expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('should sort leads by status correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        sortBy: 'status',
        sortAscending: true,
      });
    });

    const { filteredLeads } = result.current;
    if (filteredLeads.length > 1) {
      for (let i = 1; i < filteredLeads.length; i++) {
        const prevStatus = filteredLeads[i - 1].status || 'Open';
        const currStatus = filteredLeads[i].status || 'Open';
        expect(prevStatus.localeCompare(currStatus)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('should sort leads by date correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        sortBy: 'created',
        sortAscending: true,
      });
    });

    const { filteredLeads } = result.current;
    if (filteredLeads.length > 1) {
      for (let i = 1; i < filteredLeads.length; i++) {
        const prevDate = new Date(filteredLeads[i - 1].created_at);
        const currDate = new Date(filteredLeads[i].created_at);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    }
  });

  it('should handle descending sort correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        sortBy: 'updated',
        sortAscending: false,
      });
    });

    const { filteredLeads } = result.current;
    if (filteredLeads.length > 1) {
      for (let i = 1; i < filteredLeads.length; i++) {
        const prevDate = new Date(filteredLeads[i - 1].updated_at);
        const currDate = new Date(filteredLeads[i].updated_at);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    }
  });

  it('should refresh leads data', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

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

    const { result } = renderHook(() => useLeadsVirtualization());

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 150));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(result.current.error).toBeTruthy();
    expect(result.current.allLeads).toEqual([]);
    expect(result.current.filteredLeads).toEqual([]);
  });

  it('should clear errors', async () => {
    // Mock error response first
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should extract all unique tags correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 150));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    const { allTags } = result.current;
    const expectedTags = [...new Set(mockLeads.flatMap(lead => lead.tags || []))];

    expect(allTags).toHaveLength(expectedTags.length);
    expectedTags.forEach(tag => {
      expect(allTags).toContain(tag);
    });
  });

  it('should apply multiple filters simultaneously', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.applyFilters({
        searchTerm: 'test',
        selectedTags: ['warm'],
        statusFilter: 'Open',
        procedenceFilter: 'Instagram',
        sortBy: 'name',
        sortAscending: true,
      });
    });

    const { filteredLeads } = result.current;

    filteredLeads.forEach(lead => {
      // Check search term
      const matchesSearch =
        lead.username.toLowerCase().includes('test') ||
        lead.full_name?.toLowerCase().includes('test') ||
        lead.notes?.toLowerCase().includes('test') ||
        lead.tags?.some(tag => tag.toLowerCase().includes('test'));

      if (filteredLeads.length > 0) {
        expect(matchesSearch).toBe(true);
        expect(lead.tags).toContain('warm');
        expect(lead.status || 'Open').toBe('Open');
        expect(lead.procedence).toBe('Instagram');
      }
    });
  });

  it('should update filtered count correctly', async () => {
    const { result } = renderHook(() => useLeadsVirtualization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.filteredCount;

    act(() => {
      result.current.applyFilters({
        statusFilter: 'Open',
      });
    });

    // Filtered count should match the number of filtered leads
    expect(result.current.filteredCount).toBe(result.current.filteredLeads.length);

    // If filter is restrictive, count should be less than or equal to initial
    if (result.current.filteredLeads.some(lead => lead.status !== 'Open')) {
      expect(result.current.filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });
});
