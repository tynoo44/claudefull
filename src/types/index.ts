export interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  tone: string;
  variables: string;
  uses: number;
  conversionRate: number;
  isFavorite: boolean;
}

export type LeadStatus = 'Open' | 'Conectar y Cualificar' | 'Situación Actual' | 'Situación Deseada' | 'Obstáculo' | 'Compromiso' | 'Oferta' | 'Agenda' | 'Follow Up' | 'Freeze' | 'Lose';

export type LeadProcedence = 'Outbound' | 'Inbound' | 'CTA' | 'Spam';

export interface Lead {
  id: number;
  username: string;
  fullName: string;
  status: LeadStatus;
  stage: LeadStatus;
  lastUpdated: string;
  avatar: string;
  tags: string[];
  bio?: string;
  source?: string;
  procedence?: LeadProcedence;
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
    [key: string]: any;
  };
  unreadCount?: number;
  hasUnansweredMessages?: boolean;
  openedAt?: string;
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