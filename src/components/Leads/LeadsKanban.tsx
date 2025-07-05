import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../lib/supabase';
import { KanbanColumn } from './KanbanColumn';
import { LeadInfoModal } from '../Chat/LeadInfoModal';

interface LeadsKanbanProps {
  darkMode: boolean;
  leads: Lead[];
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

export const LeadsKanban: React.FC<LeadsKanbanProps> = ({ darkMode, leads, onLeadUpdate }) => {
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

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {} as Record<LeadStatus, Lead[]>;

    KANBAN_COLUMNS.forEach(column => {
      grouped[column.id] = leads.filter(lead => (lead.status || 'Open') === column.id);
    });

    return grouped;
  }, [leads]);

  // Handle lead modal
  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  }, []);

  const handleLeadModalClose = useCallback(() => {
    setShowLeadModal(false);
    setSelectedLead(null);
  }, []);

  const handleLeadModalUpdate = useCallback(
    (updatedLead: Lead) => {
      onLeadUpdate(updatedLead);
    },
    [onLeadUpdate],
  );

  // Calculate total width for container
  const totalWidth = useMemo(() => {
    const normalColumns = KANBAN_COLUMNS.length - minimizedColumns.size;
    const minimizedCount = minimizedColumns.size;
    return (
      normalColumns * columnWidth +
      minimizedCount * MINIMIZED_COLUMN_WIDTH +
      KANBAN_COLUMNS.length * 16
    ); // 16px gap
  }, [columnWidth, minimizedColumns.size]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Controls */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Vista Kanban
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Ancho de columnas:
              </span>
              <input
                type="range"
                min="200"
                max="400"
                value={columnWidth}
                onChange={e => handleColumnWidthChange(Number(e.target.value))}
                className="w-20"
              />
              <span className={`text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {columnWidth}px
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimizedColumns(new Set())}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
              Expandir Todo
            </button>
            <button
              onClick={() => setMinimizedColumns(new Set(KANBAN_COLUMNS.map(col => col.id)))}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Minimize2 className="w-4 h-4" />
              Minimizar Todo
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div
          id="kanban-container"
          className="kanban-container flex-1 overflow-x-auto overflow-y-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex gap-4 p-4 h-full" style={{ width: totalWidth }}>
            {KANBAN_COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                darkMode={darkMode}
                status={column.id}
                title={column.title}
                icon={column.icon}
                color={column.color}
                leads={leadsByStatus[column.id] || []}
                columnWidth={minimizedColumns.has(column.id) ? MINIMIZED_COLUMN_WIDTH : columnWidth}
                isMinimized={minimizedColumns.has(column.id)}
                onToggleMinimize={() => toggleColumnMinimize(column.id)}
                onLeadUpdate={onLeadUpdate}
                onLeadClick={handleLeadClick}
              />
            ))}
          </div>
        </div>

        {/* Lead Info Modal */}
        <LeadInfoModal
          darkMode={darkMode}
          lead={selectedLead}
          isOpen={showLeadModal}
          onClose={handleLeadModalClose}
          onUpdate={handleLeadModalUpdate}
        />
      </div>
    </DndProvider>
  );
};
