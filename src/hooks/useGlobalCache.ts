import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Lead, MessageTemplate } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CacheState {
  leads: Lead[];
  templates: MessageTemplate[];
  dashboardStats: {
    totalLeads: number;
    activeConversations: number;
    totalMessages: number;
    conversationsByStatus: Record<string, number>;
  };
  lastUpdated: {
    leads: number;
    templates: number;
    dashboardStats: number;
  };
  totalCounts: {
    leads: number;
    templates: number;
  };
  pageSize: number;
}

interface RealtimeSubscriptions {
  leads?: RealtimeChannel | null;
  templates?: RealtimeChannel | null;
  conversations?: RealtimeChannel | null;
  messages?: RealtimeChannel | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const STORAGE_KEY = 'setterai_cache';

// Cache global persistente
let globalCache: CacheState = {
  leads: [],
  templates: [],
  dashboardStats: {
    totalLeads: 0,
    activeConversations: 0,
    totalMessages: 0,
    conversationsByStatus: {},
  },
  lastUpdated: {
    leads: 0,
    templates: 0,
    dashboardStats: 0,
  },
  totalCounts: {
    leads: 0,
    templates: 0,
  },
  pageSize: 50,
};

// Cargar cache desde localStorage al inicializar
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    globalCache = { ...globalCache, ...parsed };
  }
} catch (error) {
  console.error('Error loading cache from localStorage:', error);
}

export const useGlobalCache = () => {
  const [cache, setCache] = useState<CacheState>(globalCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptions = useRef<RealtimeSubscriptions>({});
  const initialized = useRef(false);

  // Guardar cache en localStorage
  const saveToStorage = useCallback((newCache: CacheState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }, []);

  // Actualizar cache global y local
  const updateCache = useCallback(
    (updates: Partial<CacheState>) => {
      const newCache = { ...globalCache, ...updates };
      globalCache = newCache;
      setCache(newCache);
      saveToStorage(newCache);
    },
    [saveToStorage],
  );

  // Verificar si los datos necesitan actualizarse
  const needsUpdate = useCallback((dataType: keyof CacheState['lastUpdated']) => {
    const lastUpdate = globalCache.lastUpdated[dataType];
    return Date.now() - lastUpdate > CACHE_DURATION;
  }, []);

  // Cargar leads desde Supabase (con paginación)
  const loadLeads = useCallback(
    async (force = false, append = false) => {
      if (!force && !append && !needsUpdate('leads') && globalCache.leads.length > 0) {
        return globalCache.leads;
      }

      try {
        setLoading(true);

        // Calcular el rango para la paginación
        const from = append ? globalCache.leads.length : 0;
        const to = from + globalCache.pageSize - 1;

        const { data, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .order('updated_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        const newLeads = data || [];
        const updatedLeads = append ? [...globalCache.leads, ...newLeads] : newLeads;

        updateCache({
          leads: updatedLeads,
          lastUpdated: { ...globalCache.lastUpdated, leads: Date.now() },
          totalCounts: { ...globalCache.totalCounts, leads: count || 0 },
        });

        return updatedLeads;
      } catch (err) {
        console.error('Error loading leads:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar leads');
        return globalCache.leads;
      } finally {
        setLoading(false);
      }
    },
    [needsUpdate, updateCache],
  );

  // Cargar templates desde Supabase (con paginación)
  const loadTemplates = useCallback(
    async (force = false, append = false) => {
      if (!force && !append && !needsUpdate('templates') && globalCache.templates.length > 0) {
        return globalCache.templates;
      }

      try {
        setLoading(true);

        // Calcular el rango para la paginación
        const from = append ? globalCache.templates.length : 0;
        const to = from + globalCache.pageSize - 1;

        const { data, error, count } = await supabase
          .from('message_templates')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        const newTemplates = data || [];
        const updatedTemplates = append
          ? [...globalCache.templates, ...newTemplates]
          : newTemplates;

        updateCache({
          templates: updatedTemplates,
          lastUpdated: { ...globalCache.lastUpdated, templates: Date.now() },
          totalCounts: { ...globalCache.totalCounts, templates: count || 0 },
        });

        return updatedTemplates;
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar plantillas');
        return globalCache.templates;
      } finally {
        setLoading(false);
      }
    },
    [needsUpdate, updateCache],
  );

  // Cargar estadísticas del dashboard
  const loadDashboardStats = useCallback(
    async (force = false) => {
      if (!force && !needsUpdate('dashboardStats')) {
        return globalCache.dashboardStats;
      }

      try {
        setLoading(true);

        const [leadsCount, conversationsCount, messagesCount] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase.from('conversations').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
        ]);

        // Contar conversaciones por estado
        const { data: statusData } = await supabase
          .from('leads')
          .select('status')
          .not('status', 'is', null);

        const conversationsByStatus =
          statusData?.reduce(
            (acc, lead) => {
              acc[lead.status] = (acc[lead.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ) || {};

        const dashboardStats = {
          totalLeads: leadsCount.count || 0,
          activeConversations: conversationsCount.count || 0,
          totalMessages: messagesCount.count || 0,
          conversationsByStatus,
        };

        updateCache({
          dashboardStats,
          lastUpdated: { ...globalCache.lastUpdated, dashboardStats: Date.now() },
        });

        return dashboardStats;
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
        return globalCache.dashboardStats;
      } finally {
        setLoading(false);
      }
    },
    [needsUpdate, updateCache],
  );

  // Configurar suscripciones en tiempo real
  const setupRealtimeSubscriptions = useCallback(() => {
    if (Object.keys(subscriptions.current).length > 0) return; // Ya configurado

    // Suscripción a cambios en leads
    subscriptions.current.leads = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, payload => {
        console.log('Lead change detected:', payload);
        loadLeads(true); // Forzar recarga
      })
      .subscribe();

    // Suscripción a cambios en templates
    subscriptions.current.templates = supabase
      .channel('templates-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_templates' },
        payload => {
          console.log('Template change detected:', payload);
          loadTemplates(true); // Forzar recarga
        },
      )
      .subscribe();

    // Suscripción a cambios en conversaciones (para stats)
    subscriptions.current.conversations = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, payload => {
        console.log('Conversation change detected:', payload);
        loadDashboardStats(true); // Forzar recarga de stats
      })
      .subscribe();

    // Suscripción a cambios en mensajes (para stats)
    subscriptions.current.messages = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        console.log('Message change detected:', payload);
        loadDashboardStats(true); // Forzar recarga de stats
      })
      .subscribe();

    console.log('Realtime subscriptions configured');
  }, [loadLeads, loadTemplates, loadDashboardStats]);

  // Limpiar suscripciones
  const cleanupSubscriptions = useCallback(() => {
    Object.values(subscriptions.current).forEach(subscription => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    });
    subscriptions.current = {};
  }, []);

  // Inicializar cache si es necesario
  const initialize = useCallback(async () => {
    if (initialized.current) return;

    initialized.current = true;
    setLoading(true);

    try {
      // Cargar datos en paralelo
      await Promise.all([loadLeads(), loadTemplates(), loadDashboardStats()]);

      // Configurar actualizaciones en tiempo real
      setupRealtimeSubscriptions();
    } catch (err) {
      console.error('Error initializing cache:', err);
    } finally {
      setLoading(false);
    }
  }, [loadLeads, loadTemplates, loadDashboardStats, setupRealtimeSubscriptions]);

  // Forzar actualización de todos los datos
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadLeads(true), loadTemplates(true), loadDashboardStats(true)]);
    } catch (err) {
      console.error('Error refreshing cache:', err);
    } finally {
      setLoading(false);
    }
  }, [loadLeads, loadTemplates, loadDashboardStats]);

  // Invalidar cache específico
  const invalidate = useCallback(
    (dataType: keyof CacheState['lastUpdated']) => {
      updateCache({
        lastUpdated: { ...globalCache.lastUpdated, [dataType]: 0 },
      });
    },
    [updateCache],
  );

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Inicializar al montar
  useEffect(() => {
    initialize();

    // Limpiar al desmontar
    return () => {
      cleanupSubscriptions();
    };
  }, [initialize, cleanupSubscriptions]);

  // Funciones de paginación
  const loadMoreLeads = useCallback(async () => {
    return await loadLeads(true, true);
  }, [loadLeads]);

  const loadMoreTemplates = useCallback(async () => {
    return await loadTemplates(true, true);
  }, [loadTemplates]);

  const hasMoreLeads = cache.leads.length < cache.totalCounts.leads;
  const hasMoreTemplates = cache.templates.length < cache.totalCounts.templates;

  return {
    // Datos
    leads: cache.leads,
    templates: cache.templates,
    dashboardStats: cache.dashboardStats,

    // Estados
    loading,
    error,
    lastUpdated: cache.lastUpdated,
    totalCounts: cache.totalCounts,

    // Funciones
    loadLeads,
    loadTemplates,
    loadDashboardStats,
    refresh,
    invalidate,
    clearError,

    // Funciones de paginación
    loadMoreLeads,
    loadMoreTemplates,
    hasMoreLeads,
    hasMoreTemplates,

    // Utilidades
    needsUpdate,
    isDataFresh: (dataType: keyof CacheState['lastUpdated']) => !needsUpdate(dataType),
  };
};
