import React from 'react';
import { Users, Plus, Grid3X3, List, Filter, Download } from 'lucide-react';

interface LeadsHeaderProps {
  darkMode: boolean;
  totalLeads: number;
  viewMode: 'list' | 'kanban';
  showFilters: boolean;
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  onToggleFilters: () => void;
  onAddLead: () => void;
}

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  darkMode,
  totalLeads,
  viewMode,
  showFilters,
  onViewModeChange,
  onToggleFilters,
  onAddLead
}) => {
  return (
    <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            darkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20' : 'bg-gradient-to-br from-blue-50 to-purple-50'
          }`}>
            <Users className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Leads
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {totalLeads} leads totales
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className={`flex rounded-lg p-1 ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'kanban'
                  ? darkMode 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 size={16} />
              <span className="text-sm font-medium">Kanban</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? darkMode 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              <span className="text-sm font-medium">Lista</span>
            </button>
          </div>
          
          {/* Filter Button */}
          <button
            onClick={onToggleFilters}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              showFilters
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filtros</span>
          </button>
          
          {/* Export Button */}
          <button className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'hover:bg-gray-800 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}>
            <Download size={20} />
          </button>
          
          {/* Add Lead Button */}
          <button
            onClick={onAddLead}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="font-medium">Nuevo Lead</span>
          </button>
        </div>
      </div>
    </div>
  );
};