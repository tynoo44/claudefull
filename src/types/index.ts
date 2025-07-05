export interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  tone: string;
  variables: string[];
  uses: number;
  conversionRate: number;
  isFavorite: boolean;
  created_at?: string;
  updated_at?: string;
}

export type LeadStatus =
  | 'Open'
  | 'Conectar y Cualificar'
  | 'Situación Actual'
  | 'Situación Deseada'
  | 'Obstáculo'
  | 'Compromiso'
  | 'Oferta'
  | 'Agenda'
  | 'Follow Up'
  | 'Freeze'
  | 'Lose';

export type LeadProcedence = 'Outbound' | 'Inbound' | 'CTA' | 'Spam';

export interface Lead {
  id: string;
  instagram_id?: string;
  username?: string;
  full_name?: string;
  status: LeadStatus;
  procedence: LeadProcedence;
  created_at: string;
  updated_at?: string;
  profile_pic?: string;
  tags?: string[];
  bio?: string;
  notes?: string;
  followers_count?: number;
}

export interface Chat {
  id: string;
  leadId: string;
  leadName: string;
  lastMessage: string;
  timestamp: string;
  time: string;
  unread: boolean;
  avatar: string;
  status: LeadStatus;
  isOnline: boolean;
  platform: 'instagram' | 'whatsapp' | 'facebook';
  tags?: string[];
  leadData?: {
    procedence?: LeadProcedence;
    tags?: string[];
    [key: string]: string | number | boolean | null | undefined | string[];
  };
  unreadCount?: number;
  hasUnansweredMessages?: boolean;
  openedAt?: string;
  messages?: any[]; // Messages loaded from the conversation
}

export interface Message {
  id: number;
  chatId: number;
  sender: 'user' | 'lead';
  content: string;
  timestamp: string;
  type: 'text' | 'template' | 'system';
}

export interface Appointment {
  id: number;
  leadId: number;
  leadName: string;
  title: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: string;
}

export type ModalType =
  | 'template'
  | 'importScript'
  | 'lead'
  | 'appointment'
  | 'profile'
  | 'settings'
  | null;

export type ViewMode = 'list' | 'kanban';

export type Page =
  | 'auth'
  | 'dashboard'
  | 'chats'
  | 'leads'
  | 'templates'
  | 'calendar'
  | 'analytics'
  | 'profile';

export interface ConversationWithLead {
  id: string;
  lead_id: string;
  leads: Lead;
  lastMessage: {
    text: string;
    created_at: string;
  };
  updated_at: string;
  unreadCount: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string | null;
  tone: string;
  variables: string[];
  uses: number;
  conversion_rate: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  last_used?: string;
}
