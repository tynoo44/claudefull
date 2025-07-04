import React from 'react';
import { Lead } from '../../lib/supabase';
import { LeadCard } from './LeadCard';

interface LeadsListProps {
  darkMode: boolean;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

export const LeadsList: React.FC<LeadsListProps> = ({
  darkMode,
  leads,
  onEditLead,
  onDeleteLead
}) => {
  return (
    <div className={`rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Lead
              </th>
              <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Estado
              </th>
              <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Tags
              </th>
              <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Última Actividad
              </th>
              <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                darkMode={darkMode}
                lead={lead}
                viewMode="list"
                onEdit={onEditLead}
                onDelete={onDeleteLead}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {leads.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No se encontraron leads</p>
        </div>
      )}
    </div>
  );
};