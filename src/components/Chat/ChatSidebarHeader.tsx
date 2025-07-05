import React from 'react';
import { MessageSquare, ChevronLeft } from 'lucide-react';

interface ChatSidebarHeaderProps {
  darkMode: boolean;
  totalCount: number;
  loadedCount: number;
  onCollapse: () => void;
}

export const ChatSidebarHeader: React.FC<ChatSidebarHeaderProps> = ({
  darkMode,
  totalCount,
  loadedCount,
  onCollapse,
}) => {
  return (
    <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${
              darkMode ? 'from-blue-500/20 to-blue-600/20' : 'from-blue-500/10 to-blue-600/10'
            }`}
          >
            <MessageSquare className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conversaciones
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {totalCount} chats • {loadedCount} cargados
            </p>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
