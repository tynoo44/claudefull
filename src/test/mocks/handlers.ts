import { http, HttpResponse } from 'msw';

// Mock data
const mockMessages = [
  {
    id: 1,
    conversation_id: 'conv-1',
    sender_type: 'Lead',
    text: 'Hello there!',
    platform_message_id: 'msg-1',
    created_at: '2025-07-20T10:00:00Z',
    total_count: 3,
    has_more: true,
  },
  {
    id: 2,
    conversation_id: 'conv-1',
    sender_type: 'Setter',
    text: 'Hi! How can I help you?',
    platform_message_id: 'msg-2',
    created_at: '2025-07-20T10:01:00Z',
    total_count: 3,
    has_more: true,
  },
  {
    id: 3,
    conversation_id: 'conv-1',
    sender_type: 'Lead',
    text: 'I need information about your services',
    platform_message_id: 'msg-3',
    created_at: '2025-07-20T10:02:00Z',
    total_count: 3,
    has_more: false,
  },
];

const mockLeads = [
  {
    id: '1',
    username: 'testuser1',
    full_name: 'Test User 1',
    profile_pic: null,
    instagram_id: 'ig-1',
    followers_count: 1000,
    user_id: 'user-1',
    created_at: '2025-07-20T09:00:00Z',
    updated_at: '2025-07-20T10:00:00Z',
    tags: ['interested', 'warm'],
    notes: 'Good prospect',
    status: 'Open',
    procedence: 'Instagram',
    conversation_count: 2,
    last_message_date: '2025-07-20T10:02:00Z',
  },
  {
    id: '2',
    username: 'testuser2',
    full_name: 'Test User 2',
    profile_pic: null,
    instagram_id: 'ig-2',
    followers_count: 2000,
    user_id: 'user-1',
    created_at: '2025-07-20T08:00:00Z',
    updated_at: '2025-07-20T09:00:00Z',
    tags: ['cold'],
    notes: null,
    status: 'Contacted',
    procedence: 'WhatsApp',
    conversation_count: 1,
    last_message_date: '2025-07-20T09:30:00Z',
  },
];

export const handlers = [
  // Mock Supabase RPC calls for messages
  http.post('*/rest/v1/rpc/get_initial_messages', () => {
    return HttpResponse.json(mockMessages.slice(0, 2)); // First page
  }),

  http.post('*/rest/v1/rpc/get_messages_paginated', () => {
    return HttpResponse.json(mockMessages.slice(2)); // Next page
  }),

  // Mock Supabase RPC calls for leads
  http.post('*/rest/v1/rpc/get_all_leads_optimized', () => {
    return HttpResponse.json(mockLeads);
  }),

  // Mock regular Supabase table queries
  http.get('*/rest/v1/leads', ({ request }) => {
    const url = new globalThis.URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      const lead = mockLeads.find(l => l.id === id);
      return HttpResponse.json([lead].filter(Boolean));
    }

    return HttpResponse.json(mockLeads);
  }),

  http.get('*/rest/v1/messages', () => {
    return HttpResponse.json(mockMessages);
  }),

  // Mock realtime channel subscriptions (these will be ignored in tests)
  http.post('*/realtime/v1/websocket', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];

// Export mock data for use in tests
export { mockMessages, mockLeads };
