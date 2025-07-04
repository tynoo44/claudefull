import { Template, Lead, Chat, Message, Appointment } from '@/types';

export const sampleTemplates: Template[] = [
  {
    id: 'FU24',
    name: 'FU 24',
    content: 'Buenas! Paso por aquí para subirte el chat, por si se te había enterrado',
    category: 'Seguimiento',
    tone: 'Directo',
    variables: 'Ninguna',
    uses: 5,
    conversionRate: 15,
    isFavorite: true
  },
  {
    id: 'INTRO1',
    name: 'Introducción Cálida',
    content: 'Hola {nombre}! Vi tu perfil y me pareció muy interesante lo que haces en {nicho}...',
    category: 'Apertura',
    tone: 'Amigable',
    variables: 'nombre, nicho',
    uses: 23,
    conversionRate: 42,
    isFavorite: false
  }
];

export const sampleLeads: Lead[] = [
  { 
    id: 1, 
    username: 'gersantacreu', 
    fullName: 'Gerard Santacreu', 
    status: 'Open', 
    stage: 'open', 
    lastUpdated: '4 jul', 
    avatar: '👤', 
    tags: ['Interesado', 'Coaching'] 
  },
  { 
    id: 2, 
    username: 'stekovisuals', 
    fullName: 'StekoVisuals', 
    status: 'Open', 
    stage: 'qualify', 
    lastUpdated: '4 jul', 
    avatar: '👤', 
    tags: ['Agencia'] 
  },
  { 
    id: 3, 
    username: 'marialopez', 
    fullName: 'María López', 
    status: 'Qualified', 
    stage: 'interested', 
    lastUpdated: '3 jul', 
    avatar: '👤', 
    tags: ['Coaching', 'Nutrición'] 
  },
  { 
    id: 4, 
    username: 'carlosruiz', 
    fullName: 'Carlos Ruiz', 
    status: 'Appointment Set', 
    stage: 'appointment', 
    lastUpdated: '2 jul', 
    avatar: '👤', 
    tags: ['Consultoría'] 
  }
];

export const sampleChats: Chat[] = [
  {
    id: 1,
    leadId: 1,
    leadName: 'Gerard Santacreu',
    lastMessage: 'Perfecto, quedamos mañana entonces',
    timestamp: '14:30',
    unread: true,
    avatar: '👤',
    status: 'online'
  },
  {
    id: 2,
    leadId: 2,
    leadName: 'StekoVisuals',
    lastMessage: 'Me interesa conocer más sobre los precios',
    timestamp: '12:15',
    unread: false,
    avatar: '👤',
    status: 'offline'
  }
];

export const sampleMessages: Message[] = [
  {
    id: 1,
    chatId: 1,
    sender: 'lead',
    content: 'Hola! Vi tu post sobre coaching y me interesa mucho',
    timestamp: '14:00',
    type: 'text'
  },
  {
    id: 2,
    chatId: 1,
    sender: 'user',
    content: 'Hola! Me alegra saber de tu interés. ¿Qué aspecto específico te llamó más la atención?',
    timestamp: '14:05',
    type: 'text'
  },
  {
    id: 3,
    chatId: 1,
    sender: 'lead',
    content: 'Perfecto, quedamos mañana entonces',
    timestamp: '14:30',
    type: 'text'
  }
];

export const sampleAppointments: Appointment[] = [
  {
    id: 1,
    leadId: 4,
    leadName: 'Carlos Ruiz',
    title: 'Llamada de descubrimiento',
    date: '2024-07-05',
    time: '10:00',
    status: 'scheduled',
    type: 'Consulta inicial'
  },
  {
    id: 2,
    leadId: 3,
    leadName: 'María López',
    title: 'Sesión de seguimiento',
    date: '2024-07-05',
    time: '15:30',
    status: 'scheduled',
    type: 'Seguimiento'
  }
];