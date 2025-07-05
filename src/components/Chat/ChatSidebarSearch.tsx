import React from 'react';
import { Search } from 'lucide-react';

interface ChatSidebarSearchProps {
  darkMode: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ChatSidebarSearch: React.FC<ChatSidebarSearchProps> = ({
  darkMode,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="relative mb-4">
      <Search
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      />
      <input
        type="text"
        placeholder="Buscar chats..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
          darkMode
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
      />
    </div>
  );
};
