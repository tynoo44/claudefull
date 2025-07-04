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
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  darkMode,
  chats,
  selectedChat,
  searchTerm,
  onSearchChange,
  onChatSelect
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredChats = chats.filter(chat =>
    chat.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className={`relative w-16 border-r transition-all duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-16 space-y-2 px-2">
          {filteredChats.slice(0, 5).map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                selectedChat?.id === chat.id
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <span className="text-lg">{chat.avatar}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-80 border-r transition-all duration-300 flex flex-col ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
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
            onClick={() => setIsCollapsed(true)}
            className={`p-1 rounded transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
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
            className={`p-4 border-b cursor-pointer transition-colors ${
              selectedChat?.id === chat.id
                ? (darkMode ? 'bg-blue-900/30 border-gray-600' : 'bg-blue-50 border-gray-200')
                : (darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200')
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm">{chat.avatar}</span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
                  chat.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
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
                    <span className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
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