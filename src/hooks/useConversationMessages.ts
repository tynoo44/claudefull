import { useState, useEffect } from 'react';
import { Message } from '../lib/supabase';
import { getMessagesForConversation, subscribeToMessages } from '../lib/supabase-functions';
import { analyzeConversation } from '../lib/ai-service';

interface ConversationMessagesResult {
  messages: Message[];
  loading: boolean;
  analyzing: boolean;
  analysisError?: string;
}

export const useConversationMessages = (
  conversationId: string | null,
  leadId?: string | null,
): ConversationMessagesResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | undefined>();

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
        unsubscribe = subscribeToMessages(conversationId, messagePayload => {
          // Convert MessagePayload to Message format
          const newMessage: Message = {
            ...messagePayload,
            platform_message_id: null, // This field is required by Message interface
          };
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

  // Trigger automatic analysis when messages are loaded or updated
  useEffect(() => {
    if (!conversationId || !leadId || messages.length === 0 || loading) {
      return;
    }

    const analyzeConversation = async () => {
      setAnalyzing(true);
      setAnalysisError(undefined);

      try {
        const result = await analyzeConversation({
          conversationId,
          leadId,
          messages: messages.map(m => ({
            role: m.sender_type === 'lead' ? 'user' : 'assistant',
            content: m.text
          })),
          forceReanalyze: false,
        });

        if (!result.success) {
          setAnalysisError(result.error);
        } else if (result.isNewAnalysis) {
          console.log('Conversation analyzed successfully:', {
            conversationId,
            phase: result.memory?.current_phase,
            score: result.memory?.qualification_score?.score,
          });
        }
      } catch (error) {
        console.error('Error analyzing conversation:', error);
        setAnalysisError('Error al analizar la conversación');
      } finally {
        setAnalyzing(false);
      }
    };

    // Debounce analysis to avoid multiple calls
    const timeoutId = setTimeout(analyzeConversation, 1000);

    return () => clearTimeout(timeoutId);
  }, [conversationId, leadId, messages, loading]);

  return { messages, loading, analyzing, analysisError };
};
