import { createClient } from '@supabase/supabase-js';
import { LeadStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export types
export type LeadProcedence = 'Outbound' | 'Inbound' | 'CTA' | 'Spam';
export type { LeadStatus };

// Tipos para las tablas de la base de datos
export interface Lead {
  id: string;
  instagram_id: string;
  username: string;
  full_name: string | null;
  created_at: string;
  profile_pic: string | null;
  followers_count: number | null;
  updated_at: string;
  notes: string | null;
  tags: string[];
  user_id: string | null;
  status?: LeadStatus;
  procedence?: LeadProcedence;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string | null;
  tone: string | null;
  is_favorite: boolean | null;
  usage_count: number | null;
  conversion_rate: number | null;
  created_at: string;
  updated_at: string;
  purpose: string | null;
  variables: string[] | null;
  last_used?: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  opened_at: string;
  updated_at: string;
  // Campos de la relación con leads
  username?: string;
  full_name?: string;
  profile_pic?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'Lead' | 'Setter' | null;
  text: string | null;
  platform_message_id: string | null;
  created_at: string;
}

// Funciones de utilidad para la API
// Leads
export const getLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Lead[];
};

export const getLeadById = async (id: string) => {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();

  if (error) throw error;
  return data as Lead;
};

export const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('leads').insert([leadData]).select().single();

  if (error) throw error;
  return data as Lead;
};

export const updateLead = async (
  id: string,
  leadData: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>,
) => {
  const { data, error } = await supabase
    .from('leads')
    .update(leadData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
};

export const deleteLead = async (id: string) => {
  const { error } = await supabase.from('leads').delete().eq('id', id);

  if (error) throw error;
  return true;
};

// Message Templates
export const getMessageTemplates = async () => {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as MessageTemplate[];
};

export const getMessageTemplatesByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as MessageTemplate[];
};

export const createMessageTemplate = async (
  templateData: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>,
) => {
  const { data, error } = await supabase
    .from('message_templates')
    .insert([templateData])
    .select()
    .single();

  if (error) throw error;
  return data as MessageTemplate;
};

export const updateMessageTemplate = async (
  id: string,
  templateData: Partial<Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>>,
) => {
  const { data, error } = await supabase
    .from('message_templates')
    .update(templateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MessageTemplate;
};

export const deleteMessageTemplate = async (id: string) => {
  const { error } = await supabase.from('message_templates').delete().eq('id', id);

  if (error) throw error;
  return true;
};

export const incrementTemplateUsage = async (id: string) => {
  // First get current usage count
  const { data: current, error: fetchError } = await supabase
    .from('message_templates')
    .select('usage_count')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Update with incremented value
  const { data, error } = await supabase
    .from('message_templates')
    .update({ usage_count: (current.usage_count || 0) + 1 })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MessageTemplate;
};

// Conversations
export const getConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      leads (
        username,
        full_name,
        profile_pic,
        status
      )
    `,
    )
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get conversations with last message
export const getConversationsWithLastMessage = async () => {
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(
      `
      *,
      leads (
        username,
        full_name,
        profile_pic,
        status
      )
    `,
    )
    .order('updated_at', { ascending: false });

  if (convError) throw convError;

  // Get last message for each conversation
  const conversationsWithMessages = await Promise.all(
    conversations?.map(async conv => {
      const { data: messages } = await supabase
        .from('messages')
        .select('text, created_at, sender_type')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        ...conv,
        lastMessage: messages && messages.length > 0 ? messages[0] : null,
      };
    }) || [],
  );

  return conversationsWithMessages;
};

export const getConversationById = async (id: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      leads (
        username,
        full_name,
        profile_pic
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Messages
export const getMessagesByConversation = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Message[];
};

export const sendMessage = async (messageData: Omit<Message, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('messages').insert([messageData]).select().single();

  if (error) throw error;
  return data as Message;
};

// Dashboard stats
export const getDashboardStats = async () => {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    throw new Error('Error fetching dashboard stats: ' + error.message);
  }

  const stats = data?.[0];
  if (!stats) {
    throw new Error('No stats data returned');
  }

  return {
    totalLeads: Number(stats.total_leads) || 0,
    activeConversations: Number(stats.active_conversations) || 0,
    totalMessages: Number(stats.total_messages) || 0,
    conversationsByStatus: stats.conversations_by_status || {},
    leadsLast7Days: Number(stats.leads_last_7_days) || 0,
    leadsLast30Days: Number(stats.leads_last_30_days) || 0,
    messagesLast24h: Number(stats.messages_last_24h) || 0,
    messagesLast7Days: Number(stats.messages_last_7_days) || 0,
    leadsByProcedence: stats.leads_by_procedence || {},
    leadsByStatus: stats.leads_by_status || {},
  };
};
