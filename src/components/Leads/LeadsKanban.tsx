import React from 'react';
import { Users, Target, Calendar, CheckCircle, AlertTriangle, Handshake, DollarSign, Clock, ArrowUp, Snowflake, X } from 'lucide-react';
import { Lead } from '../../lib/supabase';
import { LeadCard } from './LeadCard';

interface LeadsKanbanProps {
  darkMode: boolean;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

const kanbanColumns: KanbanColumn[] = [
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
  { id: 'Lose', title: 'Lose', icon: X, color: 'red' }
];

export const LeadsKanban: React.FC<LeadsKanbanProps> = ({
  darkMode,
  leads,
  onEditLead,
  onDeleteLead
}) => {
  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => (lead.status || 'Open') === status);
  };

  const getColumnColor = (color: string, darkMode: boolean) => {
    const colors = {
      blue: darkMode ? 'from-blue-900/20 to-blue-800/20' : 'from-blue-50 to-blue-100',
      yellow: darkMode ? 'from-yellow-900/20 to-yellow-800/20' : 'from-yellow-50 to-yellow-100',
      purple: darkMode ? 'from-purple-900/20 to-purple-800/20' : 'from-purple-50 to-purple-100',
      orange: darkMode ? 'from-orange-900/20 to-orange-800/20' : 'from-orange-50 to-orange-100',
      green: darkMode ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100',
      red: darkMode ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100',
      indigo: darkMode ? 'from-indigo-900/20 to-indigo-800/20' : 'from-indigo-50 to-indigo-100',
      teal: darkMode ? 'from-teal-900/20 to-teal-800/20' : 'from-teal-50 to-teal-100',
      gray: darkMode ? 'from-gray-900/20 to-gray-800/20' : 'from-gray-50 to-gray-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string, darkMode: boolean) => {
    const colors = {
      blue: darkMode ? 'text-blue-400' : 'text-blue-600',
      yellow: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      purple: darkMode ? 'text-purple-400' : 'text-purple-600',
      orange: darkMode ? 'text-orange-400' : 'text-orange-600',
      green: darkMode ? 'text-green-400' : 'text-green-600',
      red: darkMode ? 'text-red-400' : 'text-red-600',
      indigo: darkMode ? 'text-indigo-400' : 'text-indigo-600',
      teal: darkMode ? 'text-teal-400' : 'text-teal-600',
      gray: darkMode ? 'text-gray-400' : 'text-gray-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-11 gap-2 h-full overflow-x-auto">
      {kanbanColumns.map((column) => {
        const columnLeads = getLeadsByStatus(column.id);
        const Icon = column.icon;
        
        return (
          <div key={column.id} className="flex flex-col">
            <div className={`p-4 rounded-t-xl bg-gradient-to-br ${getColumnColor(column.color, darkMode)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${getIconColor(column.color, darkMode)}`} />
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {column.title}
                  </h3>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}>
                  {columnLeads.length}
                </span>
              </div>
            </div>
            
            <div className={`flex-1 p-2 space-y-3 overflow-y-auto rounded-b-xl ${
              darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  darkMode={darkMode}
                  lead={lead}
                  viewMode="kanban"
                  onEdit={onEditLead}
                  onDelete={onDeleteLead}
                />
              ))}
              
              {columnLeads.length === 0 && (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p className="text-sm">Sin leads en esta fase</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};