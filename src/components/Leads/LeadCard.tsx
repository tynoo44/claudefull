import React from 'react';
import { MessageCircle, Calendar, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Lead } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface LeadCardProps {
  darkMode: boolean;
  lead: Lead;
  viewMode: 'list' | 'kanban';
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  darkMode,
  lead,
  viewMode,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();
  
  const handleChatClick = () => {
    navigate('/chats');
  };

  if (viewMode === 'kanban') {
    return (
      <div className={`p-4 rounded-lg border transition-all cursor-move hover:shadow-md ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {lead.profile_pic ? (
              <img 
                src={lead.profile_pic} 
                alt={lead.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
            <div>
              <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {lead.full_name || lead.username}
              </h4>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                @{lead.username}
              </p>
            </div>
          </div>
          <button className={`p-1 rounded transition-colors ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}>
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
        
        {lead.notes && (
          <p className={`text-xs mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {lead.notes}
          </p>
        )}
        
        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {tag}
              </span>
            ))}
            {lead.tags.length > 2 && (
              <span className={`text-xs px-2 py-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                +{lead.tags.length - 2}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs">
          <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Calendar size={12} />
            {new Date(lead.updated_at).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handleChatClick}
              className={`p-1.5 rounded transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle size={14} />
            </button>
            <button
              onClick={() => onEdit(lead)}
              className={`p-1.5 rounded transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <tr className={`border-b transition-colors hover:bg-opacity-50 ${
      darkMode 
        ? 'border-gray-700 hover:bg-gray-800' 
        : 'border-gray-200 hover:bg-gray-50'
    }`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {lead.profile_pic ? (
            <img 
              src={lead.profile_pic} 
              alt={lead.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          )}
          <div>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {lead.full_name || lead.username}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              @{lead.username}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          lead.status === 'open' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        }`}>
          {lead.status || 'open'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {lead.tags.map((tag, index) => (
            <span key={index} className={`text-xs px-2 py-1 rounded-full ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {new Date(lead.updated_at).toLocaleDateString('es-ES')}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleChatClick}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle size={16} />
          </button>
          <button
            onClick={() => onEdit(lead)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' 
                : 'hover:bg-gray-100 text-red-600 hover:text-red-700'
            }`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};