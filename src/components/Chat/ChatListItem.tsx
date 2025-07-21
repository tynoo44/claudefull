import React from 'react';
import { Hash } from 'lucide-react';
import { Chat } from '@/types';
import { getStatusClasses } from '../../utils/statusUtils';

interface ChatWithUnreadCount extends Chat {
  unreadCount?: number;
}

interface ChatListItemProps {
  chat: Chat;
  darkMode: boolean;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
  formatDate: (dateString: string) => string;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  darkMode,
  isSelected,
  onSelect,
  formatDate,
}) => {
  return (
    <div
      onClick={() => onSelect(chat)}
      className={`p-3 mx-2 mb-1 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? darkMode
            ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30'
            : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
          : darkMode
            ? 'hover:bg-gray-700/50'
            : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Foto */}
        <div className="relative flex-shrink-0">
          {chat.avatar.startsWith('data:image/svg') ? (
            <div
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-sm"
              dangerouslySetInnerHTML={{ __html: decodeURIComponent(chat.avatar.split(',')[1]) }}
            />
          ) : (
            <img
              src={chat.avatar}
              alt={chat.leadName}
              className="w-10 h-10 rounded-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%23${darkMode ? '374151' : 'E5E7EB'}" cx="50" cy="50" r="50"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${chat.leadName.charAt(0).toUpperCase()}</text></svg>`;
              }}
            />
          )}
        </div>

        {/* Nombre y último mensaje */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-medium truncate ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {chat.leadName}
            </h3>

            {/* Badges y fecha */}
            <div className="flex items-center gap-1.5 ml-2">
              {/* Procedencia */}
              {chat.leadData?.procedence && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full border text-center min-w-[50px] ${
                    chat.leadData.procedence === 'Outbound'
                      ? darkMode
                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-400'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                      : chat.leadData.procedence === 'Inbound'
                        ? darkMode
                          ? 'bg-green-900/20 border-green-500/50 text-green-400'
                          : 'bg-green-50 border-green-300 text-green-700'
                        : chat.leadData.procedence === 'CTA'
                          ? darkMode
                            ? 'bg-purple-900/20 border-purple-500/50 text-purple-400'
                            : 'bg-purple-50 border-purple-300 text-purple-700'
                          : darkMode
                            ? 'bg-red-900/20 border-red-500/50 text-red-400'
                            : 'bg-red-50 border-red-300 text-red-700'
                  }`}
                >
                  {chat.leadData.procedence}
                </span>
              )}

              {/* Status */}
              {chat.status && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusClasses(
                    chat.status,
                    darkMode,
                  )}`}
                >
                  {chat.status.length > 8 ? chat.status.substring(0, 8) + '...' : chat.status}
                </span>
              )}

              {/* Fecha */}
              <span
                className={`text-xs whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {formatDate(chat.timestamp)}
              </span>

              {/* Contador no leídos */}
              {chat.unread && (
                <span className="flex items-center justify-center min-w-[18px] h-4 px-1 bg-red-500 text-white text-xs font-medium rounded-full">
                  {(chat as ChatWithUnreadCount).unreadCount || '•'}
                </span>
              )}
            </div>
          </div>

          {/* Último mensaje */}
          <div className="mt-1">
            <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {chat.lastMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
