import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Message } from '../../lib/supabase';
import { MessageSkeleton } from '../common/SkeletonLoaders';

interface MessageListVirtualizedProps {
  darkMode: boolean;
  messages: Message[];
  loading: boolean;
  hasMoreMessages?: boolean;
  isFetchingMoreMessages?: boolean;
  onLoadMoreMessages?: () => void;
}

const MessageItem: React.FC<{
  message: Message;
  darkMode: boolean;
}> = ({ message, darkMode }) => {
  return (
    <div
      className={`flex ${message.sender_type === 'Setter' ? 'justify-end' : 'justify-start'} px-4 py-2`}
    >
      <div
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          message.sender_type === 'Setter'
            ? 'bg-blue-500 text-white'
            : darkMode
              ? 'bg-gray-700 text-white'
              : 'bg-gray-200 text-gray-900'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            message.sender_type === 'Setter' ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export const MessageListVirtualized: React.FC<MessageListVirtualizedProps> = ({
  darkMode,
  messages,
  loading,
  hasMoreMessages,
  isFetchingMoreMessages,
  onLoadMoreMessages,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const previousMessageCount = useRef(messages.length);

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each message
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

      // Check if user is at bottom (auto-scroll detection)
      const isAtBottom =
        scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100;
      setIsAutoScrolling(isAtBottom);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isFetchingMoreMessages, onLoadMoreMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (
      messages.length > previousMessageCount.current &&
      isAutoScrolling &&
      parentRef.current
    ) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
      });
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, isAutoScrolling]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && parentRef.current) {
      requestAnimationFrame(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
      });
    }
  }, [messages.length > 0]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1">
        <MessageSkeleton darkMode={darkMode} />
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

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      {/* Load more indicator at the top */}
      {isFetchingMoreMessages && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Virtual list container */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Only render visible items */}
        {virtualItems.map(virtualItem => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageItem message={message} darkMode={darkMode} />
            </div>
          );
        })}
      </div>
    </div>
  );
};