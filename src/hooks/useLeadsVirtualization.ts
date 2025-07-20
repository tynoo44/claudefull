import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Lead } from '../lib/supabase';

interface LeadWithMetadata extends Lead {
  conversation_count?: number;
  last_message_date?: string;
}

interface FilterOptions {
  searchTerm?: string;
  selectedTags?: string[];
  statusFilter?: string;
  procedenceFilter?: string;
  sortBy?: 'updated' | 'name' | 'status' | 'created';
  sortAscending?: boolean;
}

export const useLeadsVirtualization = () => {
  // All leads in memory for filtering
  const [allLeads, setAllLeads] = useState<LeadWithMetadata[]>([]);
  // Filtered leads based on current filters
  const [filteredLeads, setFilteredLeads] = useState<LeadWithMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialized = useRef(false);
  const realtimeSubscriptions = useRef<RealtimeChannel[]>([]);
  const currentFilters = useRef<FilterOptions>({});

  // Load all leads at once into memory
  const loadAllLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_all_leads_optimized');

      if (rpcError) throw rpcError;

      const transformedLeads = (data || []).map((lead: any) => ({
        id: lead.id,
        username: lead.username,
        full_name: lead.full_name,
        profile_pic: lead.profile_pic,
        instagram_id: lead.instagram_id,
        followers_count: Number(lead.followers_count) || 0,
        user_id: lead.user_id,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        tags: lead.tags || [],
        notes: lead.notes,
        status: lead.status || 'Open',
        procedence: lead.procedence,
        conversation_count: lead.conversation_count || 0,
        last_message_date: lead.last_message_date,
      }));

      setAllLeads(transformedLeads);
      // Apply current filters to new data
      applyFiltersInternal(transformedLeads, currentFilters.current);

      return transformedLeads;
    } catch (err) {
      console.error('Error loading leads:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar leads');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Internal filter application
  const applyFiltersInternal = useCallback((leads: LeadWithMetadata[], filters: FilterOptions) => {
    let filtered = [...leads];
    const { searchTerm, selectedTags, statusFilter, procedenceFilter, sortBy, sortAscending } =
      filters;

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
    if (selectedTags && selectedTags.length > 0) {
      filtered = filtered.filter(lead => selectedTags.some(tag => lead.tags?.includes(tag)));
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(lead => (lead.status || 'Open') === statusFilter);
    }

    // Apply procedence filter
    if (procedenceFilter && procedenceFilter !== 'all') {
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

    setFilteredLeads(filtered);
  }, []);

  // Public filter application
  const applyFilters = useCallback(
    (filters: FilterOptions) => {
      currentFilters.current = filters;
      applyFiltersInternal(allLeads, filters);
    },
    [allLeads, applyFiltersInternal],
  );

  // Group leads by status for kanban view
  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, LeadWithMetadata[]> = {};

    filteredLeads.forEach(lead => {
      const status = lead.status || 'Open';
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(lead);
    });

    return grouped;
  }, [filteredLeads]);

  // Update specific lead
  const updateLead = useCallback(
    async (leadId: string) => {
      try {
        const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();

        if (error) throw error;

        // Get metadata for the updated lead
        const { data: metadata } = await supabase
          .rpc('get_all_leads_optimized')
          .eq('id', leadId)
          .single();

        const updatedLead = metadata || data;

        // Update in all leads
        setAllLeads(prev => {
          const newLeads = prev.map(lead =>
            lead.id === leadId
              ? {
                  ...lead,
                  ...updatedLead,
                  followers_count: Number(updatedLead.followers_count) || 0,
                  conversation_count:
                    updatedLead.conversation_count || lead.conversation_count || 0,
                  last_message_date: updatedLead.last_message_date || lead.last_message_date,
                }
              : lead,
          );
          // Re-apply filters with updated data
          applyFiltersInternal(newLeads, currentFilters.current);
          return newLeads;
        });
      } catch (err) {
        console.error('Error updating lead:', err);
      }
    },
    [applyFiltersInternal],
  );

  // Initialize on mount
  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    isInitialized.current = true;
    await loadAllLeads();
  }, [loadAllLeads]);

  // Reset and reload
  const refresh = useCallback(async () => {
    isInitialized.current = false;
    setAllLeads([]);
    setFilteredLeads([]);
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
          setAllLeads(prev => {
            const newLeads = prev.filter(lead => lead.id !== payload.old.id);
            applyFiltersInternal(newLeads, currentFilters.current);
            return newLeads;
          });
        }
      })
      .subscribe();

    realtimeSubscriptions.current = [leadsChannel];
  }, [refresh, updateLead, applyFiltersInternal]);

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

  // Get all unique tags
  const allTags = useMemo(() => {
    return [...new Set(allLeads.flatMap(lead => lead?.tags || []))];
  }, [allLeads]);

  return {
    allLeads,
    filteredLeads,
    leadsByStatus,
    loading,
    error,
    totalCount: allLeads.length,
    filteredCount: filteredLeads.length,
    applyFilters,
    refresh,
    allTags,
    clearError: () => setError(null),
  };
};
