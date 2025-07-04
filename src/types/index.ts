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

export interface Lead {
  id: number;
  username: string;
  fullName: string;
  status: string;
  stage: 'open' | 'qualify' | 'interested' | 'appointment' | 'closed';
  lastUpdated: string;
  avatar: string;
  tags: string[];
  bio?: string;
  source?: string;
}

export interface Chat {
  id: string;
  leadId: number;
  leadName: string;
  lastMessage: string;
  timestamp: string;
  time: string;
  unread: boolean;
  avatar: string;
  status: 'online' | 'offline';
  platform: 'instagram' | 'whatsapp' | 'facebook';
  tags?: string[];
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