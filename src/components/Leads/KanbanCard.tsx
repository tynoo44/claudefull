import React, { useRef } from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { Calendar, Hash, User, MapPin, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '../../lib/supabase';
import { createConversationForLead } from '../../lib/supabase-functions';

interface KanbanCardProps {
  darkMode: boolean;
  lead: Lead;
  onClick: () => void;
}

const PROCEDENCE_COLORS = {
  Outbound: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  Inbound: { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  CTA: { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  Spam: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ darkMode, lead, onClick }) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [{ isDragging }, drag] = useDrag({
    type: 'lead',
    item: { lead },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(dragRef);

  const handleChatClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const conversation = await createConversationForLead(lead.id);
      navigate('/chats', {
        state: { selectedChatId: conversation.id },
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      ref={dragRef}
      onClick={onClick}
      className={`kanban-card p-3.5 rounded-xl border transition-all cursor-pointer group ${
        isDragging ? 'opacity-50 scale-95 drag-preview' : 'hover:shadow-md hover:-translate-y-0.5'
      } ${
        darkMode
          ? 'bg-gray-800/80 border-gray-700/60 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header with Avatar and Name */}
      <div className="flex items-center gap-3 mb-2.5">
        {lead.profile_pic ? (
          <img
            src={lead.profile_pic}
            alt={lead.username}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
              darkMode
                ? 'bg-gradient-to-br from-blue-600/30 to-indigo-600/30 text-blue-300'
                : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
            }`}
          >
            {lead.full_name ? getInitials(lead.full_name) : <User className="w-4 h-4" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4
            className={`font-medium text-sm truncate leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {lead.full_name || lead.username}
          </h4>
          <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            @{lead.username}
          </p>
        </div>
      </div>

      {/* Procedence badge */}
      {lead.procedence && (
        <div className="mb-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
              darkMode
                ? PROCEDENCE_COLORS[lead.procedence].dark
                : PROCEDENCE_COLORS[lead.procedence].light
            }`}
          >
            <MapPin className="w-3 h-3" />
            {lead.procedence}
          </span>
        </div>
      )}

      {/* Notes Preview */}
      {lead.notes && (
        <p
          className={`text-xs mb-2.5 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {lead.notes}
        </p>
      )}

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {lead.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className={`text-xs px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Hash className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {lead.tags.length > 2 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md ${
                darkMode ? 'bg-gray-700/60 text-gray-500' : 'bg-gray-100 text-gray-400'
              }`}
            >
              +{lead.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className={`flex items-center justify-between text-xs pt-2 border-t ${
          darkMode ? 'border-gray-700/50' : 'border-gray-100'
        }`}
      >
        <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <Calendar className="w-3 h-3" />
          {new Date(lead.updated_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          })}
        </span>

        <button
          onClick={handleChatClick}
          className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400'
              : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'
          }`}
          title="Abrir chat"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
