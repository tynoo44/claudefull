import { supabase } from './supabase';

// Funciones mejoradas para la gestión de chats con manejo de errores robusto

export async function getConversationsWithDetails() {
  try {
    // Primero obtenemos todas las conversaciones con sus leads
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        leads!inner (
          id,
          username,
          full_name,
          profile_pic,
          status,
          tags,
          notes,
          followers_count
        )
      `)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw new Error(`Error al cargar conversaciones: ${convError.message}`);
    }

    if (!conversations || conversations.length === 0) {
      return [];
    }

    // Obtener el último mensaje de cada conversación
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('id, text, created_at, sender_type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (msgError) {
            console.error(`Error fetching messages for conversation ${conv.id}:`, msgError);
          }

          // Contar mensajes sin leer (últimas 24 horas y tipo Lead)
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'Lead')
            .gte('created_at', twentyFourHoursAgo);

          return {
            ...conv,
            lastMessage: messages?.[0] || null,
            unreadCount: unreadCount || 0
          };
        } catch (error) {
          console.error(`Error processing conversation ${conv.id}:`, error);
          return {
            ...conv,
            lastMessage: null,
            unreadCount: 0
          };
        }
      })
    );

    return conversationsWithMessages;
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
  senderType: 'Lead' | 'Setter' = 'Setter'
) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          text,
          sender_type: senderType,
          platform_message_id: null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw new Error(`Error al enviar mensaje: ${error.message}`);
    }

    // Actualizar la fecha de la conversación
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
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
        }
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
export function subscribeToMessages(conversationId: string, callback: (message: any) => void) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToConversations(callback: (conversation: any) => void) {
  const channel = supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}