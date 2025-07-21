import React from 'react';
import { MessageCircle, Calendar, Trash2, MoreVertical } from 'lucide-react';
import { Lead } from '../../types';
import { useConversationsQuery } from '../../hooks/useConversationsQuery';
import { useNavigate } from 'react-router-dom';
import { getStatusClasses } from '../../utils/statusUtils';
import { TagsPopover } from './TagsPopover';

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
  onDelete,
}) => {
  const navigate = useNavigate();

  // Get conversations data
  const { data: conversationsData } = useConversationsQuery();
  const conversations = conversationsData?.pages.flatMap(page => page.data) || [];

  const handleChatClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      // Get conversation for this lead
      const conversation = conversations.find(conv => conv.lead_id === lead.id);

      if (!conversation) {
        console.error('No conversation found for lead:', lead.id);
        alert('No se encontró conversación para este lead');
        return;
      }

      // Navigate to chats with conversation selected
      navigate('/chats', { state: { selectedChatId: conversation.id } });
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  const handleCardClick = () => {
    onEdit(lead);
  };

  if (viewMode === 'kanban') {
    return (
      <>
        <div
          onClick={handleCardClick}
          className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
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
            <button
              onClick={e => e.stopPropagation()}
              className={`p-1 rounded transition-colors ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <MoreVertical size={16} className="text-gray-400" />
            </button>
          </div>

          {lead.notes && (
            <p
              className={`text-xs mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {lead.notes}
            </p>
          )}

          {lead.tags && lead.tags.length > 0 && (
            <div className="mb-3">
              <TagsPopover tags={lead.tags} darkMode={darkMode} maxVisible={2} />
            </div>
          )}

          <div className="mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${getStatusClasses(
                lead.status || 'Open',
                darkMode,
              )}`}
            >
              {lead.status || 'Open'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span
              className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              <Calendar size={12} />
              {new Date(lead.updated_at || Date.now()).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
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
            </div>
          </div>
        </div>
      </>
    );
  }

  // List View
  return (
    <>
      <tr
        onClick={handleCardClick}
        className={`border-b transition-colors hover:bg-opacity-50 cursor-pointer ${
          darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
        }`}
      >
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
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(
              lead.status || 'Open',
              darkMode,
            )}`}
          >
            {lead.status || 'Open'}
          </span>
        </td>
        <td className="px-6 py-4">
          <TagsPopover tags={lead.tags || []} darkMode={darkMode} maxVisible={3} />
        </td>
        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {new Date(lead.updated_at || Date.now()).toLocaleDateString('es-ES')}
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
              onClick={e => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
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
    </>
  );
};
