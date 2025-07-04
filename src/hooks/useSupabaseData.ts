import { useState, useEffect } from 'react';
import { SupabaseService, Lead, MessageTemplate } from '../lib/supabase';
import { getConversationsWithDetails } from '../lib/supabase-functions';

export const useSupabaseData = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    activeConversations: 0,
    totalMessages: 0,
    conversationsByStatus: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        leadsData,
        templatesData,
        conversationsData,
        statsData
      ] = await Promise.all([
        SupabaseService.getLeads(),
        SupabaseService.getMessageTemplates(),
        getConversationsWithDetails(),
        SupabaseService.getDashboardStats()
      ]);

      setLeads(leadsData);
      setTemplates(templatesData);
      setConversations(conversationsData);
      setDashboardStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific data types
  const fetchLeads = async () => {
    try {
      const data = await SupabaseService.getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar leads');
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await SupabaseService.getMessageTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar plantillas');
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await getConversationsWithDetails();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await SupabaseService.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Utility functions for transforming data to match existing interfaces
  const getChatsFromConversations = () => {
    return conversations.map(conv => {
      const leadData = conv.leads;
      const lastMessage = conv.lastMessage;
      
      const time = lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : new Date(conv.updated_at).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return {
        id: conv.id,
        leadId: conv.lead_id,
        leadName: leadData?.full_name || leadData?.username || 'Usuario desconocido',
        lastMessage: lastMessage?.text || 'Sin mensajes',
        timestamp: lastMessage ? lastMessage.created_at : conv.updated_at,
        time: time,
        unread: conv.unreadCount > 0,
        avatar: leadData?.profile_pic || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text fill="%239CA3AF" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${(leadData?.full_name || leadData?.username || 'U').charAt(0).toUpperCase()}</text></svg>`,
        status: leadData?.status || 'Open',
        isOnline: true,
        platform: 'instagram' as const,
        tags: leadData?.tags || [],
        leadData: leadData,
        unreadCount: conv.unreadCount || 0
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
      variables: template.variables?.join(', ') || '',
      uses: template.usage_count || 0,
      conversionRate: template.conversion_rate || 0,
      isFavorite: template.is_favorite || false
    }));
  };

  const getLeadsFormatted = () => {
    return leads.map(lead => ({
      id: parseInt(lead.id), // Convert UUID to number for compatibility
      name: lead.full_name || lead.username,
      username: lead.username,
      status: (lead.status || 'Open') as any,
      stage: (lead.status || 'Open') as any,
      phone: '', // Not available in current schema
      email: '', // Not available in current schema
      lastContact: new Date(lead.updated_at),
      notes: lead.notes || '',
      tags: lead.tags,
      avatar: lead.profile_pic || undefined,
      followers: lead.followers_count || 0,
      priority: 'medium' as const // Default priority
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
    clearError: () => setError(null)
  };
};