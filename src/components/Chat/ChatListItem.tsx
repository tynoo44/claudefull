import React from 'react';
import { Hash } from 'lucide-react';
import { Chat } from '@/types';
import { getStatusClasses } from '../../utils/statusUtils';
import { TagsPopover } from '../Leads/TagsPopover';

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
      className={`p-4 mx-2 mb-1 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? darkMode
            ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30'
            : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
          : darkMode
            ? 'hover:bg-gray-700/50 hover:scale-[1.02]'
            : 'hover:bg-gray-50 hover:scale-[1.02]'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          {chat.avatar.startsWith('data:image/svg') ? (
            <div
              className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium"
              dangerouslySetInnerHTML={{ __html: decodeURIComponent(chat.avatar.split(',')[1]) }}
            />
          ) : (
            <img
              src={chat.avatar}
              alt={chat.leadName}
              className="w-12 h-12 rounded-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%23${darkMode ? '374151' : 'E5E7EB'}" cx="50" cy="50" r="50"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${chat.leadName.charAt(0).toUpperCase()}</text></svg>`;
              }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h3
                className={`text-sm font-medium truncate ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {chat.leadName}
              </h3>
              {chat.status && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusClasses(
                    chat.status,
                    darkMode,
                  )}`}
                >
                  {chat.status}
                </span>
              )}
              {chat.leadData?.procedence && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
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
                          : chat.leadData.procedence === 'Spam'
                            ? darkMode
                              ? 'bg-red-900/20 border-red-500/50 text-red-400'
                              : 'bg-red-50 border-red-300 text-red-700'
                            : darkMode
                              ? 'bg-gray-900/20 border-gray-500/50 text-gray-400'
                              : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  {chat.leadData.procedence}
                </span>
              )}
            </div>
            <span
              className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {formatDate(chat.timestamp)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {chat.lastMessage}
              </p>
              {chat.tags && chat.tags.length > 0 && (
                <div className="mt-1">
                  <TagsPopover tags={chat.tags} darkMode={darkMode} maxVisible={2} />
                </div>
              )}
            </div>
            {chat.unread && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-full ml-2 flex-shrink-0 shadow-lg animate-pulse">
                {(chat as ChatWithUnreadCount).unreadCount || '•'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
