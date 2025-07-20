import React, { useRef, useEffect } from 'react';
import { Message } from '../../lib/supabase';

interface MessageListProps {
  darkMode: boolean;
  messages: Message[];
  loading: boolean;
  hasMoreMessages?: boolean;
  isFetchingMoreMessages?: boolean;
  onLoadMoreMessages?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  darkMode, 
  messages, 
  loading,
  hasMoreMessages,
  isFetchingMoreMessages,
  onLoadMoreMessages 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(messages.length);

  // Handle scroll to load more messages
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement || !hasMoreMessages || !onLoadMoreMessages) return;

    const handleScroll = () => {
      // Check if scrolled to top
      if (scrollElement.scrollTop < 100 && !isFetchingMoreMessages) {
        onLoadMoreMessages();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isFetchingMoreMessages, onLoadMoreMessages]);

  // Auto-scroll to bottom when new messages arrive (only for new messages, not when loading more)
  useEffect(() => {
    if (messages.length > previousMessageCount.current && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    previousMessageCount.current = messages.length;
  }, [messages.length]);

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
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
      {/* Load more indicator at the top */}
      {isFetchingMoreMessages && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Messages list */}
      <div className="space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            ref={index === messages.length - 1 ? lastMessageRef : undefined}
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
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
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
    </div>
  );
};
