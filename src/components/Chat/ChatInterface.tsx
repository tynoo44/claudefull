import React, { useState, useEffect } from 'react';
import { Chat, Template } from '@/types';
import { Message } from '../../lib/supabase';
import {
  getMessagesForConversation,
  sendMessageToConversation,
  subscribeToMessages,
} from '../../lib/supabase-functions';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyState } from './EmptyState';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  darkMode: boolean;
  selectedChat: Chat | null;
  message: string;
  showAISuggestion: boolean;
  onMessageChange: (message: string) => void;
  onToggleAISuggestion: () => void;
  onTemplateInsert?: (template: Template) => void;
  onChatUpdate?: (updatedChat: Chat) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  darkMode,
  selectedChat,
  message,
  showAISuggestion,
  onMessageChange,
  onToggleAISuggestion,
  onTemplateInsert: _onTemplateInsert,
  onChatUpdate,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedMessages = await getMessagesForConversation(selectedChat.id);
        setMessages(loadedMessages);

        // Suscribirse a nuevos mensajes en tiempo real
        unsubscribe = subscribeToMessages(selectedChat.id, newMessage => {
          setMessages(prev => [...prev, newMessage]);
        });
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Error al cargar los mensajes. Por favor, intenta de nuevo.');
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
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      await sendMessageToConversation(selectedChat.id, message);
      onMessageChange('');
      if (showAISuggestion) {
        onToggleAISuggestion();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!selectedChat) {
    return (
      <EmptyState
        darkMode={darkMode}
        title="Selecciona una conversación"
        description="Elige un chat de la lista para comenzar a conversar"
      />
    );
  }

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <ChatHeader darkMode={darkMode} selectedChat={selectedChat} onChatUpdate={onChatUpdate} />

      {error ? (
        <div
          className={`flex-1 flex items-center justify-center p-4 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <div
            className={`text-center max-w-md p-6 rounded-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}
          >
            <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      ) : (
        <>
          <MessageList darkMode={darkMode} messages={messages} loading={loading} />

          <MessageInput
            darkMode={darkMode}
            message={message}
            showAISuggestion={showAISuggestion}
            disabled={sending}
            onMessageChange={onMessageChange}
            onSendMessage={handleSendMessage}
            onToggleAISuggestion={onToggleAISuggestion}
          />

          {sending && (
            <div
              className={`absolute bottom-20 right-4 flex items-center gap-2 px-3 py-2 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}
            >
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enviando...
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
