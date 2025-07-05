import React, { useState, useMemo } from 'react';
import { Lead } from '../../lib/supabase';
import { LeadsListHeader } from './LeadsListHeader';
import { LeadTableRow } from './LeadTableRow';

interface LeadsListProps {
  darkMode: boolean;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLead?: (lead: Lead) => void;
}

type SortField = 'name' | 'status' | 'procedence' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export const LeadsList: React.FC<LeadsListProps> = ({
  darkMode,
  leads,
  onEditLead,
  onDeleteLead,
  onUpdateLead,
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
          aValue = a.procedence;
          bValue = b.procedence;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || a.created_at);
          bValue = new Date(b.updated_at || b.created_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortField, sortDirection]);

  if (leads.length === 0) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
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
    <div
      className={`rounded-xl border overflow-hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <LeadsListHeader
            darkMode={darkMode}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {sortedLeads.map(lead => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                darkMode={darkMode}
                onEditLead={onEditLead}
                onDeleteLead={onDeleteLead}
                onUpdateLead={onUpdateLead}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
