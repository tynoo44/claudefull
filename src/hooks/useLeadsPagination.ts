import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Lead } from '../lib/supabase';

interface LeadWithMetadata extends Lead {
  conversation_count?: number;
  last_message_date?: string;
}

const LEADS_PER_PAGE = 20;
const PREFETCH_THRESHOLD = 5;

export const useLeadsPagination = () => {
  const [leads, setLeads] = useState<LeadWithMetadata[]>([]);
  const [visibleLeads, setVisibleLeads] = useState<LeadWithMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const currentPage = useRef(0);
  const loadedLeadIds = useRef(new Set<string>());
  const isInitialized = useRef(false);
  const realtimeSubscriptions = useRef<RealtimeChannel[]>([]);

  // Load all leads using optimized RPC
  const loadAllLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use optimized RPC to get all leads with metadata
      const { data, error: rpcError } = await supabase.rpc('get_all_leads_optimized');

      if (rpcError) throw rpcError;

      const transformedLeads = (data || []).map((lead: Record<string, unknown>) => ({
        id: String(lead.id),
        username: String(lead.username),
        full_name: lead.full_name ? String(lead.full_name) : null,
        profile_pic: lead.profile_pic ? String(lead.profile_pic) : null,
        instagram_id: String(lead.instagram_id),
        followers_count: Number(lead.followers_count) || 0, // Convert bigint to number
        user_id: String(lead.user_id),
        created_at: String(lead.created_at),
        updated_at: String(lead.updated_at),
        tags: Array.isArray(lead.tags) ? (lead.tags as string[]) : [],
        notes: lead.notes ? String(lead.notes) : null,
        status: String(lead.status || 'Open'),
        procedence: lead.procedence ? String(lead.procedence) : null,
        conversation_count: Number(lead.conversation_count) || 0,
        last_message_date: lead.last_message_date ? String(lead.last_message_date) : null,
      }));

      setLeads(transformedLeads);
      setTotalCount(transformedLeads.length);

      // Initially show only first page
      setVisibleLeads(transformedLeads.slice(0, LEADS_PER_PAGE));
      currentPage.current = 1;

      // Update loaded IDs
      transformedLeads.forEach((lead: LeadWithMetadata) => loadedLeadIds.current.add(lead.id));

      return transformedLeads;
    } catch (err) {
      console.error('Error loading leads:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar leads');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Ref to hold the latest leads without causing re-renders
  const leadsRef = useRef(leads);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  // Load more visible leads (pagination)
  const loadMore = useCallback(() => {
    if (loading || currentPage.current * LEADS_PER_PAGE >= totalCount) {
      setHasMore(false);
      return;
    }

    const startIndex = currentPage.current * LEADS_PER_PAGE;
    const endIndex = startIndex + LEADS_PER_PAGE;
    const nextPageLeads = leadsRef.current.slice(0, endIndex);

    setVisibleLeads(nextPageLeads);
    currentPage.current += 1;

    if (endIndex >= totalCount) {
      setHasMore(false);
    }
  }, [loading, totalCount]);

  // Check if need to load more based on scroll position
  const checkAndLoadMore = useCallback(
    (visibleIndex: number) => {
      const remainingItems = visibleLeads.length - visibleIndex;

      if (remainingItems <= PREFETCH_THRESHOLD && hasMore && !loading) {
        loadMore();
      }
    },
    [visibleLeads.length, hasMore, loading, loadMore],
  );

  // Apply filters locally on all loaded data
  const applyFilters = useCallback(
    (
      searchTerm: string = '',
      selectedTags: string[] = [],
      statusFilter: string = 'all',
      procedenceFilter: string = 'all',
      sortBy: 'updated' | 'name' | 'status' | 'created' = 'updated',
      sortAscending: boolean = false,
    ) => {
      let filtered = [...leadsRef.current];

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          lead =>
            lead.username.toLowerCase().includes(term) ||
            lead.full_name?.toLowerCase().includes(term) ||
            lead.notes?.toLowerCase().includes(term) ||
            lead.tags?.some(tag => tag.toLowerCase().includes(term)),
        );
      }

      // Apply tag filter
      if (selectedTags.length > 0) {
        filtered = filtered.filter(lead => selectedTags.some(tag => lead.tags?.includes(tag)));
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(lead => (lead.status || 'Open') === statusFilter);
      }

      // Apply procedence filter
      if (procedenceFilter !== 'all') {
        filtered = filtered.filter(lead => lead.procedence === procedenceFilter);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name': {
            const nameA = a.full_name || a.username || '';
            const nameB = b.full_name || b.username || '';
            comparison = nameA.localeCompare(nameB);
            break;
          }
          case 'status':
            comparison = (a.status || 'Open').localeCompare(b.status || 'Open');
            break;
          case 'created':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'updated':
          default:
            comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            break;
        }

        return sortAscending ? comparison : -comparison;
      });

      // Reset pagination for filtered results
      setVisibleLeads(filtered.slice(0, LEADS_PER_PAGE));
      setTotalCount(filtered.length);
      currentPage.current = 1;
      setHasMore(filtered.length > LEADS_PER_PAGE);

      // Store filtered leads for pagination
      setLeads(filtered);
    },
    [],
  );

  // Update specific lead
  const updateLead = useCallback(async (leadId: string) => {
    try {
      const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();

      if (error) throw error;

      // Update in both lists
      const updateFn = (prev: LeadWithMetadata[]) =>
        prev.map(lead => (lead.id === leadId ? { ...lead, ...data } : lead));

      setLeads(updateFn);
      setVisibleLeads(updateFn);
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  }, []);

  // Initialize on mount
  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    isInitialized.current = true;
    await loadAllLeads();
  }, [loadAllLeads]);

  // Reset and reload
  const refresh = useCallback(async () => {
    isInitialized.current = false;
    currentPage.current = 0;
    loadedLeadIds.current.clear();
    setLeads([]);
    setVisibleLeads([]);
    setHasMore(true);
    setError(null);
    await initialize();
  }, [initialize]);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    // Clear existing subscriptions
    realtimeSubscriptions.current.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    realtimeSubscriptions.current = [];

    // Subscribe to lead changes
    const leadsChannel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async payload => {
        if (payload.eventType === 'INSERT') {
          // New lead - reload all
          await refresh();
        } else if (payload.eventType === 'UPDATE') {
          // Lead updated - update specific
          await updateLead(payload.new.id);
        } else if (payload.eventType === 'DELETE') {
          // Lead deleted - remove from lists
          const removeFn = (prev: LeadWithMetadata[]) =>
            prev.filter(lead => lead.id !== payload.old.id);
          setLeads(removeFn);
          setVisibleLeads(removeFn);
          loadedLeadIds.current.delete(payload.old.id);
          setTotalCount(prev => prev - 1);
        }
      })
      .subscribe();

    realtimeSubscriptions.current = [leadsChannel];
  }, [refresh, updateLead]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(() => {
    realtimeSubscriptions.current.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    realtimeSubscriptions.current = [];
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initTimer = setTimeout(() => {
      initialize();
    }, 100);

    const realtimeTimer = setTimeout(() => {
      setupRealtimeSubscriptions();
    }, 1500);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(realtimeTimer);
      cleanupSubscriptions();
    };
  }, [initialize, setupRealtimeSubscriptions, cleanupSubscriptions]);

  return {
    leads: visibleLeads,
    allLeads: leads,
    loading,
    hasMore,
    error,
    totalCount,
    loadMore,
    checkAndLoadMore,
    applyFilters,
    refresh,
    clearError: () => setError(null),
  };
};
