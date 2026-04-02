import React, { useRef, useMemo, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Lead } from '../../lib/supabase';
import { LeadsListHeader } from './LeadsListHeader';
import { LeadTableRow } from './LeadTableRow';

interface VirtualizedLeadsListProps {
  darkMode: boolean;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLead?: (lead: Lead) => void;
}

type SortField = 'name' | 'status' | 'procedence' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 50;
const SCROLL_THRESHOLD = 100;

export const VirtualizedLeadsList: React.FC<VirtualizedLeadsListProps> = ({
  darkMode,
  leads,
  onEditLead,
  onDeleteLead,
  onUpdateLead,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sortField, setSortField] = React.useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [visibleItems, setVisibleItems] = React.useState(ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      switch (sortField) {
        case 'name':
          aValue = (a.full_name || a.username || '').toLowerCase();
          bValue = (b.full_name || b.username || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'procedence':
          aValue = a.procedence || '';
          bValue = b.procedence || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortField, sortDirection]);

  const visibleLeads = useMemo(() => {
    return sortedLeads.slice(0, visibleItems);
  }, [sortedLeads, visibleItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

      if (scrolledToBottom && visibleItems < sortedLeads.length) {
        setVisibleItems(prev => Math.min(prev + ITEMS_PER_PAGE, sortedLeads.length));
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [visibleItems, sortedLeads.length]);

  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [sortField, sortDirection, leads.length]);

  if (leads.length === 0) {
    return (
      <div
        className={`rounded-xl border h-full flex items-center justify-center ${
          darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="text-center px-6 py-16 max-w-sm">
          <div
            className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}
          >
            <Users className={`w-7 h-7 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <h3
            className={`text-base font-semibold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
          >
            Sin leads todavia
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Los leads apareceran aqui cuando los crees o importes desde tus conversaciones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden h-full flex flex-col ${
        darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      {/* Sticky header */}
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <table className="min-w-full">
          <LeadsListHeader
            darkMode={darkMode}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </table>
      </div>

      {/* Scrollable body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <table className="min-w-full">
          <tbody className={darkMode ? 'divide-y divide-gray-700/50' : 'divide-y divide-gray-100'}>
            {visibleLeads.map(lead => (
              <LeadTableRow
                key={lead.id}
                darkMode={darkMode}
                lead={lead}
                onEditLead={() => onEditLead(lead)}
                onDeleteLead={() => onDeleteLead(lead.id)}
                onUpdateLead={onUpdateLead}
              />
            ))}
          </tbody>
        </table>

        {visibleItems < sortedLeads.length && (
          <div className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="animate-pulse text-sm">Cargando mas leads...</div>
          </div>
        )}
      </div>

      {/* Footer count */}
      <div
        className={`px-4 py-2 text-xs border-t ${
          darkMode ? 'border-gray-700/50 text-gray-500' : 'border-gray-100 text-gray-400'
        }`}
      >
        Mostrando {Math.min(visibleItems, sortedLeads.length)} de {sortedLeads.length} leads
      </div>
    </div>
  );
};
