import { useState, useEffect } from 'react';
import { getConversationsWithDetails } from '../lib/supabase-functions';
import { useGlobalCache } from './useGlobalCache';
import type { ConversationWithLead } from '../types';

export const useSupabaseData = () => {
  const [conversations, setConversations] = useState<ConversationWithLead[]>([]);

  // Usar el caché global para datos principales
  const {
    leads,
    templates,
    dashboardStats,
    loading: cacheLoading,
    error: cacheError,
    refresh: refreshCache,
    loadLeads,
    loadTemplates,
    loadDashboardStats,
    clearError: clearCacheError,
  } = useGlobalCache();

  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  // Estado combinado
  const loading = cacheLoading || conversationsLoading;
  const error = cacheError || conversationsError;

  // Fetch all data (optimizado con caché)
  const fetchAllData = async () => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);
      clearCacheError();

      // Usar caché para datos principales y cargar conversaciones por separado
      const [conversationsData] = await Promise.all([
        getConversationsWithDetails(),
        refreshCache(), // Esto actualiza leads, templates y stats usando caché
      ]);

      setConversations(conversationsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setConversationsError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setConversationsLoading(false);
    }
  };

  // Fetch specific data types (usando caché)
  const fetchLeads = async () => {
    await loadLeads(true); // Forzar recarga
  };

  const fetchTemplates = async () => {
    await loadTemplates(true); // Forzar recarga
  };

  const fetchConversations = async () => {
    try {
      setConversationsLoading(true);
      const data = await getConversationsWithDetails();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversationsError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    await loadDashboardStats(true); // Forzar recarga
  };

  // Initial data load (solo conversaciones, el caché se maneja automáticamente)
  useEffect(() => {
    if (leads.length === 0 || templates.length === 0) {
      // Si no hay datos en caché, usar fetchAllData
      fetchAllData();
    } else {
      // Si hay datos en caché, solo cargar conversaciones
      fetchConversations();
    }
  }, []);

  // Utility functions for transforming data to match existing interfaces
  const getChatsFromConversations = () => {
    return conversations.map(conv => {
      const leadData = conv.leads;
      const lastMessage = conv.lastMessage;

      const time = lastMessage
        ? new Date(lastMessage.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : new Date(conv.updated_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          });

      return {
        id: conv.id,
        leadId: conv.lead_id,
        leadName: leadData?.full_name || leadData?.username || 'Usuario desconocido',
        lastMessage: lastMessage?.text || 'Sin mensajes',
        timestamp: lastMessage ? lastMessage.created_at : conv.updated_at,
        time: time,
        unread: conv.unreadCount > 0,
        avatar:
          leadData?.profile_pic ||
          `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text fill="%239CA3AF" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${(leadData?.full_name || leadData?.username || 'U').charAt(0).toUpperCase()}</text></svg>`,
        status: leadData?.status || 'Open',
        isOnline: true,
        platform: 'instagram' as const,
        tags: leadData?.tags || [],
        leadData: leadData,
        unreadCount: conv.unreadCount || 0,
      };
    });
  };

  const getTemplatesFormatted = () => {
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      content: template.content,
      category: template.category || 'General',
      tone: template.tone || 'Neutral',
      variables: template.variables || [],
      uses: template.usage_count || 0,
      conversionRate: template.conversion_rate || 0,
      isFavorite: template.is_favorite || false,
      created_at: template.created_at,
      updated_at: template.updated_at,
    }));
  };

  const getLeadsFormatted = () => {
    return leads.map(lead => ({
      id: parseInt(lead.id), // Convert UUID to number for compatibility
      name: lead.full_name || lead.username,
      username: lead.username,
      status: lead.status || 'Open',
      stage: lead.status || 'Open',
      phone: '', // Not available in current schema
      email: '', // Not available in current schema
      lastContact: new Date(lead.updated_at),
      notes: lead.notes || '',
      tags: lead.tags,
      avatar: lead.profile_pic || undefined,
      followers: lead.followers_count || 0,
      priority: 'medium' as const, // Default priority
    }));
  };

  return {
    // Raw data
    leads,
    templates,
    conversations,
    dashboardStats,

    // Formatted data for compatibility
    chats: getChatsFromConversations(),
    templatesFormatted: getTemplatesFormatted(),
    leadsFormatted: getLeadsFormatted(),

    // Loading states
    loading,
    error,

    // Refetch functions
    fetchAllData,
    fetchLeads,
    fetchTemplates,
    fetchConversations,
    fetchDashboardStats,

    // Clear error
    clearError: () => {
      clearCacheError();
      setConversationsError(null);
    },
  };
};
