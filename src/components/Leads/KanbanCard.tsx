import React, { useRef } from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { Calendar, Clock, Hash, User, MapPin } from 'lucide-react';
import { Lead } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';

interface KanbanCardProps {
  darkMode: boolean;
  lead: Lead;
  onClick: () => void;
}

const PROCEDENCE_COLORS = {
  'Outbound': { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  'Inbound': { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  'CTA': { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  'Spam': { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' }
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  darkMode,
  lead,
  onClick
}) => {
  const dragRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'lead',
    item: { lead },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(dragRef);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      ref={dragRef}
      onClick={onClick}
      className={`kanban-card p-4 rounded-lg border transition-all cursor-pointer group ${
        isDragging 
          ? 'opacity-50 scale-95 drag-preview' 
          : 'hover:shadow-lg hover:scale-[1.02] active:scale-95'
      } ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header with Avatar and Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {lead.profile_pic ? (
            <img 
              src={lead.profile_pic} 
              alt={lead.username}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${
              darkMode ? 'bg-gray-700 ring-gray-800' : 'bg-gray-200 ring-white'
            }`}>
              <User className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {lead.full_name || lead.username}
            </h4>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              @{lead.username}
            </p>
          </div>
        </div>
      </div>

      {/* Procedencia */}
      {lead.procedence && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            darkMode 
              ? PROCEDENCE_COLORS[lead.procedence].dark
              : PROCEDENCE_COLORS[lead.procedence].light
          }`}>
            <MapPin className="w-3 h-3" />
            {lead.procedence}
          </span>
        </div>
      )}

      {/* Notes Preview */}
      {lead.notes && (
        <p className={`text-xs mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {lead.notes}
        </p>
      )}
      
      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <Hash className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {lead.tags.length > 2 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              +{lead.tags.length - 2}
            </span>
          )}
        </div>
      )}
      
      {/* Status Badge */}
      <div className="mb-3">
        <span className={`text-xs px-2 py-1 rounded-full border ${
          getStatusClasses(lead.status || 'Open', darkMode)
        }`}>
          {lead.status || 'Open'}
        </span>
      </div>
      
      {/* Footer with Dates */}
      <div className={`flex items-center justify-between text-xs pt-2 border-t ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <Calendar className="w-3 h-3" />
          <span title={`Creado: ${formatDateTime(lead.created_at)}`}>
            {formatDate(lead.created_at)}
          </span>
        </div>
        <div className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <Clock className="w-3 h-3" />
          <span title={`Última actualización: ${formatDateTime(lead.updated_at)}`}>
            {formatDate(lead.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
};