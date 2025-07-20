import React, { useState, useCallback, useRef } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Lead, LeadStatus, updateLead } from '../../lib/supabase';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  darkMode: boolean;
  status: LeadStatus;
  title: string;
  icon: React.ElementType;
  color: string;
  leads: Lead[];
  columnWidth: number;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onLeadUpdate: (updatedLead: Lead) => void;
  onLeadClick: (lead: Lead) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  darkMode,
  status,
  title,
  icon: Icon,
  color,
  leads,
  columnWidth,
  isMinimized,
  onToggleMinimize,
  onLeadUpdate,
  onLeadClick,
}) => {
  const [isDropping, setIsDropping] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'lead',
    drop: async (item: { lead: Lead }) => {
      if (item.lead.status !== status) {
        try {
          setIsDropping(true);
          const updatedLead = await updateLead(item.lead.id, { status });
          onLeadUpdate(updatedLead);
        } catch (error) {
          console.error('Error updating lead status:', error);
        } finally {
          setIsDropping(false);
        }
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(dropRef);

  const getColumnColor = useCallback(() => {
    const colors = {
      blue: darkMode ? 'from-blue-900/20 to-blue-800/20' : 'from-blue-50 to-blue-100',
      yellow: darkMode ? 'from-yellow-900/20 to-yellow-800/20' : 'from-yellow-50 to-yellow-100',
      purple: darkMode ? 'from-purple-900/20 to-purple-800/20' : 'from-purple-50 to-purple-100',
      orange: darkMode ? 'from-orange-900/20 to-orange-800/20' : 'from-orange-50 to-orange-100',
      green: darkMode ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100',
      red: darkMode ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100',
      indigo: darkMode ? 'from-indigo-900/20 to-indigo-800/20' : 'from-indigo-50 to-indigo-100',
      teal: darkMode ? 'from-teal-900/20 to-teal-800/20' : 'from-teal-50 to-teal-100',
      gray: darkMode ? 'from-gray-900/20 to-gray-800/20' : 'from-gray-50 to-gray-100',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  }, [color, darkMode]);

  const getIconColor = useCallback(() => {
    const colors = {
      blue: darkMode ? 'text-blue-400' : 'text-blue-600',
      yellow: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      purple: darkMode ? 'text-purple-400' : 'text-purple-600',
      orange: darkMode ? 'text-orange-400' : 'text-orange-600',
      green: darkMode ? 'text-green-400' : 'text-green-600',
      red: darkMode ? 'text-red-400' : 'text-red-600',
      indigo: darkMode ? 'text-indigo-400' : 'text-indigo-600',
      teal: darkMode ? 'text-teal-400' : 'text-teal-600',
      gray: darkMode ? 'text-gray-400' : 'text-gray-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  }, [color, darkMode]);

  if (isMinimized) {
    return (
      <div className="flex flex-col h-full">
        <button
          onClick={onToggleMinimize}
          className={`w-12 p-3 rounded-xl bg-gradient-to-br ${getColumnColor()} hover:opacity-80 transition-all group`}
          title={`Expandir ${title}`}
        >
          <div className="flex flex-col items-center gap-2">
            <Icon className={`w-5 h-5 ${getIconColor()}`} />
            <ChevronRight
              className={`w-4 h-4 ${getIconColor()} group-hover:scale-110 transition-transform`}
            />
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
              }`}
            >
              {leads.length}
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={dropRef}
      className={`flex flex-col h-full transition-all duration-200 ${
        isOver && canDrop ? 'scale-105' : ''
      }`}
      style={{ width: columnWidth }}
    >
      {/* Header */}
      <div
        className={`column-header p-4 rounded-t-xl bg-gradient-to-br cursor-pointer hover:opacity-90 transition-opacity ${getColumnColor()} ${
          isOver && canDrop ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
        }`}
        onClick={onToggleMinimize}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${getIconColor()}`} />
            <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            <ChevronLeft
              className={`w-4 h-4 opacity-60 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
              }`}
            >
              {leads.length}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`kanban-column-content flex-1 p-3 space-y-3 overflow-y-auto rounded-b-xl transition-colors ${
          darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
        } ${isOver && canDrop ? (darkMode ? 'bg-gray-700/70' : 'bg-gray-100') : ''}`}
      >
        {isDropping && (
          <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Actualizando...</p>
          </div>
        )}

        {leads.map(lead => (
          <KanbanCard
            key={lead.id}
            darkMode={darkMode}
            lead={lead}
            onClick={() => onLeadClick(lead)}
          />
        ))}

        {leads.length === 0 && !isDropping && (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Icon className={`w-8 h-8 mx-auto mb-2 opacity-30 ${getIconColor()}`} />
            <p className="text-sm">Sin leads en esta fase</p>
          </div>
        )}
      </div>
    </div>
  );
};
