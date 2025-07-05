import { useState, useEffect } from 'react';
import { Message } from '../lib/supabase';
import { getMessagesForConversation, subscribeToMessages } from '../lib/supabase-functions';

export const useConversationMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await getMessagesForConversation(conversationId);
        setMessages(data);

        // Subscribe to new messages
        unsubscribe = subscribeToMessages(conversationId, (newMessage: Message) => {
          setMessages(prev => [...prev, newMessage]);
        });
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [conversationId]);

  return { messages, loading };
};
