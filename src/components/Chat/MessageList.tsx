import React, { useRef, useEffect } from 'react';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
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
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimación inicial de la altura de cada mensaje
    overscan: 5,
  });

  // Handle scroll to load more messages
  useEffect(() => {
    const scrollElement = parentRef.current;
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages, rowVirtualizer]);

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
    <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
          const msg = messages[virtualItem.index];
          return (
            <div
              key={msg.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={`flex ${msg.sender_type === 'Setter' ? 'justify-end' : 'justify-start'} mb-4`}
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
          );
        })}
      </div>
    </div>
  );
};
