import React, { useRef, useEffect } from 'react';
import { Message } from '../../lib/supabase';

interface MessageListProps {
  darkMode: boolean;
  messages: Message[];
  loading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ darkMode, messages, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No hay mensajes en esta conversación
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${msg.sender_type === 'Setter' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] px-4 py-2 rounded-lg ${
              msg.sender_type === 'Setter'
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            <p
              className={`text-xs mt-1 ${
                msg.sender_type === 'Setter' ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
