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
export class SupabaseService {
  // Leads
  static async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
  }

  static async getLeadById(id: string) {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();

    if (error) throw error;
    return data as Lead;
  }

  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('leads').insert([leadData]).select().single();

    if (error) throw error;
    return data as Lead;
  }

  static async updateLead(
    id: string,
    leadData: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>,
  ) {
    const { data, error } = await supabase
      .from('leads')
      .update(leadData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }

  static async deleteLead(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) throw error;
    return true;
  }

  // Message Templates
  static async getMessageTemplates() {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MessageTemplate[];
  }

  static async getMessageTemplatesByCategory(category: string) {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MessageTemplate[];
  }

  static async createMessageTemplate(
    templateData: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>,
  ) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert([templateData])
      .select()
      .single();

    if (error) throw error;
    return data as MessageTemplate;
  }

  static async updateMessageTemplate(
    id: string,
    templateData: Partial<Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>>,
  ) {
    const { data, error } = await supabase
      .from('message_templates')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MessageTemplate;
  }

  static async deleteMessageTemplate(id: string) {
    const { error } = await supabase.from('message_templates').delete().eq('id', id);

    if (error) throw error;
    return true;
  }

  static async incrementTemplateUsage(id: string) {
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
  }

  // Conversations
  static async getConversations() {
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
  }

  // Get conversations with last message
  static async getConversationsWithLastMessage() {
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
  }

  static async getConversationById(id: string) {
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
  }

  // Messages
  static async getMessagesByConversation(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  }

  static async sendMessage(messageData: Omit<Message, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('messages').insert([messageData]).select().single();

    if (error) throw error;
    return data as Message;
  }

  // Dashboard stats
  static async getDashboardStats() {
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at');

    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, updated_at');

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('id, created_at');

    if (leadsError || conversationsError || messagesError) {
      throw new Error('Error fetching dashboard stats');
    }

    return {
      totalLeads: leadsData?.length || 0,
      activeConversations: conversationsData?.length || 0,
      totalMessages: messagesData?.length || 0,
      conversationsByStatus: {},
    };
  }
}
