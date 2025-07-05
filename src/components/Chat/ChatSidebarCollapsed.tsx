import React from 'react';
import { ChevronRight, Loader } from 'lucide-react';
import { Chat } from '@/types';

interface ChatSidebarCollapsedProps {
  darkMode: boolean;
  chats: Chat[];
  selectedChat: Chat | null;
  loading: boolean;
  onExpand: () => void;
  onChatSelect: (chat: Chat) => void;
  checkAndLoadMore: (index: number) => void;
}

export const ChatSidebarCollapsed: React.FC<ChatSidebarCollapsedProps> = ({
  darkMode,
  chats,
  selectedChat,
  loading,
  onExpand,
  onChatSelect,
  checkAndLoadMore,
}) => {
  return (
    <div
      className={`relative h-full w-16 border-r transition-all duration-300 flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="p-4 flex-shrink-0">
        <button
          onClick={onExpand}
          className={`w-full p-2 rounded-lg transition-colors ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-scroll scrollbar-hide px-2 space-y-2">
        {chats.map((chat, index) => {
          if (index === chats.length - 5) {
            checkAndLoadMore(index);
          }

          return (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                selectedChat?.id === chat.id
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : darkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:scale-105'
                    : 'hover:bg-gray-100 text-gray-600 hover:scale-105'
              }`}
              title={chat.leadName}
            >
              {chat.avatar.startsWith('data:image/svg') ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: decodeURIComponent(chat.avatar.split(',')[1]),
                  }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <img
                  src={chat.avatar}
                  alt={chat.leadName}
                  className="w-full h-full object-cover rounded-full"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%23${darkMode ? '374151' : 'E5E7EB'}" cx="50" cy="50" r="50"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${chat.leadName.charAt(0).toUpperCase()}</text></svg>`;
                  }}
                />
              )}
              {chat.unread && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800 animate-pulse" />
              )}
            </button>
          );
        })}

        {loading && (
          <div className="flex justify-center py-2">
            <Loader
              className={`w-4 h-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
