import { supabase } from './supabase';
import { ConversationWithLastMessage } from '../types';

interface ConversationWithLead {
  lead_id: string;
  leads: {
    instagram_id: string;
  } | null;
}

interface MessagePayload {
  id: string;
  conversation_id: string;
  sender_type: 'Lead' | 'Setter';
  text: string;
  created_at: string;
  updated_at: string;
}

interface ConversationPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

// Funciones mejoradas para la gestión de chats con manejo de errores robusto

export async function getConversationsWithDetails() {
  try {
    const { data, error } = await supabase.rpc('get_conversations_with_details_rpc');

    if (error) {
      console.error('Error fetching conversations with RPC:', error);
      throw new Error(`Error al cargar conversaciones: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // El RPC ya nos devuelve los datos con el último mensaje.
    // Ahora solo necesitamos añadir el conteo de no leídos.
    const conversationsWithUnreadCount = await Promise.all(
      (data as ConversationWithLastMessage[]).map(async conv => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_type', 'Lead')
          .gte('created_at', twentyFourHoursAgo);

        return {
          ...conv,
          lastMessage: {
            text: conv.last_message_text,
            created_at: conv.last_message_created_at,
            sender_type: conv.last_message_sender_type,
          },
          unreadCount: unreadCount || 0,
        };
      }),
    );

    return conversationsWithUnreadCount;
  } catch (error) {
    console.error('Error in getConversationsWithDetails:', error);
    throw error;
  }
}

export async function getMessagesForConversation(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Error al cargar mensajes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMessagesForConversation:', error);
    throw error;
  }
}

export async function sendMessageToConversation(
  conversationId: string,
  text: string,
  senderType: 'Lead' | 'Setter' = 'Setter',
) {
  try {
    if (senderType === 'Setter') {
      // For messages sent by you (Setter) - use Edge Function
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('lead_id, leads(instagram_id)')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error getting conversation:', convError);
        throw new Error(`Error al obtener conversación: ${convError.message}`);
      }

      const typedConversation = conversation as unknown as ConversationWithLead;

      // Call Edge Function instead of webhook
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          instagram_id: typedConversation.leads?.instagram_id,
          message: text,
          conversation_id: conversationId,
        },
      });

      if (error) {
        console.error('Error calling Edge Function:', error);
        throw new Error(`Error al enviar mensaje: ${error.message}`);
      }

      return data.message || {
        id: `edge-${Date.now()}`,
        conversation_id: conversationId,
        text,
        sender_type: senderType,
        created_at: new Date().toISOString(),
      };
    } else {
      // For Lead messages - save to Supabase as before
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            text,
            sender_type: senderType,
            platform_message_id: null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw new Error(`Error al enviar mensaje: ${error.message}`);
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    }
  } catch (error) {
    console.error('Error in sendMessageToConversation:', error);
    throw error;
  }
}

export async function createConversationForLead(leadId: string) {
  try {
    // Verificar si ya existe una conversación
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', leadId)
      .single();

    if (existing) {
      return existing;
    }

    // Crear nueva conversación
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          lead_id: leadId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error(`Error al crear conversación: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createConversationForLead:', error);
    throw error;
  }
}

// Funciones de tiempo real
export function subscribeToMessages(
  conversationId: string,
  callback: (message: MessagePayload) => void,
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      payload => {
        callback(payload.new as MessagePayload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToConversations(callback: (conversation: ConversationPayload) => void) {
  const channel = supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      payload => {
        callback(payload as ConversationPayload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
