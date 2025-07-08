import React from 'react';
import { PanelLeftClose } from 'lucide-react';

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
    <div
      className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Conversaciones
        </h2>
        <span
          className={`ml-2 text-sm font-medium px-2 py-1 rounded-full ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {loadedCount || 0}/{totalCount || 0}
        </span>
      </div>
      <button
        onClick={onCollapse}
        className={`p-1 rounded-full ${
          darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
        }`}
        aria-label="Collapse sidebar"
      >
        <PanelLeftClose size={20} />
      </button>
    </div>
  );
};
