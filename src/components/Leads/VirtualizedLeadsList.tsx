import React, { useRef, useMemo, useEffect } from 'react';
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

  // Sort leads locally for the table view
  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

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

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortField, sortDirection]);

  // Get only visible leads
  const visibleLeads = useMemo(() => {
    return sortedLeads.slice(0, visibleItems);
  }, [sortedLeads, visibleItems]);

  // Handle scroll to load more
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

  // Reset visible items when leads or sorting changes
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [sortField, sortDirection, leads.length]);

  if (leads.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-8 text-center`}>
        <p className={`text-lg mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          No hay leads disponibles
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Los leads aparecerán aquí cuando los crees o importes.
        </p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden h-full flex flex-col`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <LeadsListHeader
            darkMode={darkMode}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </table>
      </div>
      
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
      >
        <table className="min-w-full">
          <tbody className={darkMode ? 'bg-gray-700 divide-y divide-gray-600' : 'bg-white divide-y divide-gray-200'}>
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
          <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="animate-pulse">Cargando más leads...</div>
          </div>
        )}
      </div>
    </div>
  );
};