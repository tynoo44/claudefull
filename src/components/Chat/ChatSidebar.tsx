import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Chat } from '@/types';

interface ChatSidebarProps {
  darkMode: boolean;
  chats: Chat[];
  selectedChat: Chat | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onChatSelect: (chat: Chat) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  darkMode,
  chats,
  selectedChat,
  searchTerm,
  onSearchChange,
  onChatSelect,
  onCollapseChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapseChange?.(collapsed);
  };

  const filteredChats = chats.filter(chat =>
    chat.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className={`relative h-full w-16 border-r transition-all duration-300 flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={() => handleCollapse(false)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`relative w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                selectedChat?.id === chat.id
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : darkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:scale-105'
                    : 'hover:bg-gray-100 text-gray-600 hover:scale-105'
              }`}
              title={chat.leadName}
            >
              <span className="text-lg">{chat.avatar}</span>
              {chat.unread && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-80 border-r transition-all duration-300 flex flex-col ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
              darkMode 
                ? 'from-blue-500/20 to-blue-600/20' 
                : 'from-blue-500/10 to-blue-600/10'
            }`}>
              <MessageSquare className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Conversaciones
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {chats.length} chats activos
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCollapse(true)}
            className={`p-2 rounded-lg transition-all hover:scale-110 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto flex-1">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat)}
            className={`p-4 mx-2 mb-1 rounded-xl cursor-pointer transition-all ${
              selectedChat?.id === chat.id
                ? (darkMode 
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30' 
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200')
                : (darkMode 
                    ? 'hover:bg-gray-700/50 hover:scale-[1.02]' 
                    : 'hover:bg-gray-50 hover:scale-[1.02]')
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg ${
                  darkMode 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-600' 
                    : 'bg-gradient-to-br from-gray-200 to-gray-300'
                }`}>
                  <span>{chat.avatar}</span>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  chat.isOnline 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-gray-400'
                } ${darkMode ? 'border-gray-800' : 'border-white'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-medium truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {chat.leadName}
                  </h3>
                  <span className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm truncate ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full ml-2 flex-shrink-0 shadow-lg">
                      {(chat as any).unreadCount || '•'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};