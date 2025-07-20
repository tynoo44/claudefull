import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Users,
  Target,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Handshake,
  DollarSign,
  Clock,
  ArrowUp,
  Snowflake,
  X,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../lib/supabase';
import { VirtualizedKanbanColumn } from './VirtualizedKanbanColumn';
import { LeadInfoModal } from '../Chat/LeadInfoModal';

interface VirtualizedLeadsKanbanProps {
  darkMode: boolean;
  leadsByStatus: Record<string, Lead[]>;
  onLeadUpdate: (updatedLead: Lead) => void;
}

interface KanbanColumnConfig {
  id: LeadStatus;
  title: string;
  icon: React.ElementType;
  color: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: 'Open', title: 'Open', icon: Users, color: 'green' },
  { id: 'Conectar y Cualificar', title: 'Conectar y Cualificar', icon: Target, color: 'blue' },
  { id: 'Situación Actual', title: 'Situación Actual', icon: Calendar, color: 'purple' },
  { id: 'Situación Deseada', title: 'Situación Deseada', icon: CheckCircle, color: 'orange' },
  { id: 'Obstáculo', title: 'Obstáculo', icon: AlertTriangle, color: 'red' },
  { id: 'Compromiso', title: 'Compromiso', icon: Handshake, color: 'yellow' },
  { id: 'Oferta', title: 'Oferta', icon: DollarSign, color: 'indigo' },
  { id: 'Agenda', title: 'Agenda', icon: Clock, color: 'teal' },
  { id: 'Follow Up', title: 'Follow Up', icon: ArrowUp, color: 'yellow' },
  { id: 'Freeze', title: 'Freeze', icon: Snowflake, color: 'gray' },
  { id: 'Lose', title: 'Lose', icon: X, color: 'red' },
];

const DEFAULT_COLUMN_WIDTH = 280;
const MINIMIZED_COLUMN_WIDTH = 48;

export const VirtualizedLeadsKanban: React.FC<VirtualizedLeadsKanbanProps> = ({
  darkMode,
  leadsByStatus,
  onLeadUpdate,
}) => {
  const [columnWidth, setColumnWidth] = useState(DEFAULT_COLUMN_WIDTH);
  const [minimizedColumns, setMinimizedColumns] = useState<Set<LeadStatus>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  // Horizontal scroll with Shift + mouse wheel
  useEffect(() => {
    const handleWheelScroll = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        const container = document.getElementById('kanban-container');
        if (container) {
          container.scrollLeft += e.deltaY;
        }
      }
    };

    const container = document.getElementById('kanban-container');
    if (container) {
      container.addEventListener('wheel', handleWheelScroll, { passive: false });
      return () => container.removeEventListener('wheel', handleWheelScroll);
    }
  }, []);

  // Handle column width changes (synchronized for all non-minimized columns)
  const handleColumnWidthChange = useCallback((newWidth: number) => {
    setColumnWidth(Math.max(200, Math.min(400, newWidth)));
  }, []);

  // Toggle column minimization
  const toggleColumnMinimize = useCallback((columnId: LeadStatus) => {
    setMinimizedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }, []);

  // Handle lead click
  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  }, []);

  // Calculate total width for scroll
  const totalWidth = KANBAN_COLUMNS.reduce((acc, column) => {
    return acc + (minimizedColumns.has(column.id) ? MINIMIZED_COLUMN_WIDTH : columnWidth) + 8; // 8px gap
  }, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Kanban board container */}
        <div
          id="kanban-container"
          className="flex-1 overflow-x-auto overflow-y-hidden p-4"
          style={{ minWidth: '100%' }}
        >
          <div className="flex gap-2 h-full" style={{ width: `${totalWidth}px` }}>
            {KANBAN_COLUMNS.map(column => (
              <VirtualizedKanbanColumn
                key={column.id}
                darkMode={darkMode}
                columnId={column.id}
                title={column.title}
                icon={column.icon}
                color={column.color}
                leads={leadsByStatus[column.id] || []}
                width={columnWidth}
                isMinimized={minimizedColumns.has(column.id)}
                onLeadUpdate={onLeadUpdate}
                onWidthChange={handleColumnWidthChange}
                onToggleMinimize={() => toggleColumnMinimize(column.id)}
                onLeadClick={handleLeadClick}
              />
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className={`text-center py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="opacity-75">💡 Tip: Hold Shift + scroll to navigate horizontally</span>
        </div>

        {/* Lead modal */}
        {selectedLead && (
          <LeadInfoModal
            darkMode={darkMode}
            isOpen={showLeadModal}
            onClose={() => {
              setShowLeadModal(false);
              setSelectedLead(null);
            }}
            lead={selectedLead}
            onUpdate={(updatedLead: Lead) => {
              onLeadUpdate(updatedLead);
              setSelectedLead(updatedLead);
            }}
          />
        )}
      </div>
    </DndProvider>
  );
};
