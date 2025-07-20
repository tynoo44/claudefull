import React, { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Lead, LeadStatus, updateLead } from '../../lib/supabase';
import { KanbanCard } from './KanbanCard';
import { Maximize2, Minimize2 } from 'lucide-react';

interface VirtualizedKanbanColumnProps {
  darkMode: boolean;
  columnId: LeadStatus;
  title: string;
  icon: React.ElementType;
  color: string;
  leads: Lead[];
  width: number;
  isMinimized: boolean;
  onLeadUpdate: (lead: Lead) => void;
  onWidthChange: (width: number) => void;
  onToggleMinimize: () => void;
  onLeadClick: (lead: Lead) => void;
}

const ItemTypes = {
  LEAD: 'lead',
};

const ITEMS_PER_PAGE = 20;
const SCROLL_THRESHOLD = 100;

export const VirtualizedKanbanColumn: React.FC<VirtualizedKanbanColumnProps> = ({
  darkMode,
  columnId,
  title,
  icon: Icon,
  color,
  leads,
  width,
  isMinimized,
  onLeadUpdate,
  onWidthChange,
  onToggleMinimize,
  onLeadClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);

  // Get only visible leads
  const visibleLeads = leads.slice(0, visibleItems);

  // Drag and drop
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.LEAD,
    drop: async (item: { lead: Lead }) => {
      if (item.lead.status !== columnId) {
        try {
          await updateLead(item.lead.id, { status: columnId });
          onLeadUpdate({ ...item.lead, status: columnId });
        } catch (error) {
          console.error('Error updating lead status:', error);
        }
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(scrollContainerRef);

  // Handle resize
  React.useEffect(() => {
    const resizeHandle = resizeRef.current;
    if (!resizeHandle || isMinimized) return;

    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startWidth = width;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    resizeHandle.addEventListener('mousedown', handleMouseDown);
    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
    };
  }, [width, isMinimized, onWidthChange]);

  // Handle scroll to load more
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || isMinimized) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

      if (scrolledToBottom && visibleItems < leads.length) {
        setVisibleItems(prev => Math.min(prev + ITEMS_PER_PAGE, leads.length));
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [visibleItems, leads.length, isMinimized]);

  // Reset visible items when leads change
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [leads.length]);

  return (
    <div
      className={`
        ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} 
        border rounded-lg overflow-hidden flex flex-col relative
        ${isOver ? 'ring-2 ring-blue-500' : ''}
        transition-all duration-300
      `}
      style={{ width: isMinimized ? 48 : width }}
    >
      {/* Header */}
      <div
        className={`
          ${darkMode ? 'bg-gray-700' : 'bg-white'} 
          px-4 py-3 flex items-center justify-between border-b
          ${darkMode ? 'border-gray-600' : 'border-gray-200'}
        `}
      >
        {!isMinimized ? (
          <>
            <div className="flex items-center space-x-2">
              <Icon className={`w-5 h-5 text-${color}-500`} />
              <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {title}
              </h3>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({leads.length})
              </span>
            </div>
            <button
              onClick={onToggleMinimize}
              className={`p-1 rounded hover:bg-gray-600 hover:bg-opacity-20`}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleMinimize}
            className="w-full flex flex-col items-center"
            title={title}
          >
            <Icon className={`w-5 h-5 text-${color}-500 mb-1`} />
            <span className="text-xs font-semibold">{leads.length}</span>
            <Maximize2 className="w-3 h-3 mt-1" />
          </button>
        )}
      </div>

      {/* Content */}
      {!isMinimized && (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2">
          {visibleLeads.map(lead => (
            <KanbanCard
              key={lead.id}
              darkMode={darkMode}
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          ))}

          {visibleItems < leads.length && (
            <div className={`text-center py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="animate-pulse text-sm">Cargando más...</div>
            </div>
          )}
        </div>
      )}

      {/* Resize handle */}
      {!isMinimized && (
        <div
          ref={resizeRef}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 hover:bg-opacity-50"
        />
      )}
    </div>
  );
};
