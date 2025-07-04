import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Tag } from 'lucide-react';
import { Chat } from '@/types';

interface ChatHeaderProps {
  darkMode: boolean;
  selectedChat: Chat;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ darkMode, selectedChat }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    // Navegar a la página de leads con el lead seleccionado
    navigate(`/leads?id=${selectedChat.leadId}`);
  };

  return (
    <div className={`p-4 border-b flex items-center justify-between cursor-pointer transition-colors ${
      darkMode 
        ? 'border-gray-700 bg-gray-800 hover:bg-gray-750' 
        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    }`} onClick={handleProfileClick}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img src={selectedChat.avatar} alt={selectedChat.leadName} className="w-12 h-12 rounded-full object-cover" />
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
            selectedChat.isOnline ? 'bg-green-500' : 'bg-gray-400'
          } ${darkMode ? 'border-gray-800' : 'border-white'}`} />
        </div>
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {selectedChat.leadName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-sm ${
              selectedChat.isOnline ? 'text-green-500' : 'text-gray-400'
            }`}>
              {selectedChat.isOnline ? 'En línea' : 'Desconectado'}
            </p>
            {selectedChat.tags && selectedChat.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-gray-400" />
                {selectedChat.tags.map((tag, index) => (
                  <span key={index} className={`text-xs px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <button className={`p-2 rounded-lg transition-colors ${
        darkMode 
          ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
      }`}>
        <User className="w-5 h-5" />
      </button>
    </div>
  );
};
