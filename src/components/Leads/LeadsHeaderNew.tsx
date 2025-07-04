import React from 'react';
import { Users, Plus, Grid3X3, List, Filter, Download, BarChart3 } from 'lucide-react';

interface LeadsHeaderNewProps {
  darkMode: boolean;
  totalLeads: number;
  viewMode: 'list' | 'kanban';
  showFilters: boolean;
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  onToggleFilters: () => void;
  onAddLead: () => void;
}

export const LeadsHeaderNew: React.FC<LeadsHeaderNewProps> = ({
  darkMode,
  totalLeads,
  viewMode,
  showFilters,
  onViewModeChange,
  onToggleFilters,
  onAddLead
}) => {
  return (
    <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        {/* Left Section - Title & Stats */}
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
            darkMode 
              ? 'from-blue-600/20 to-purple-600/20' 
              : 'from-blue-500/10 to-purple-500/10'
          }`}>
            <Users className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Leads
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {totalLeads} totales
              </span>
              <span className={`text-sm ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
              <span className={`text-sm ${
                showFilters 
                  ? darkMode ? 'text-blue-400' : 'text-blue-600'
                  : darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {showFilters ? 'Filtros activos' : 'Sin filtros'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle - Compact */}
          <div className={`flex rounded-lg p-0.5 ${
            darkMode ? 'bg-gray-800/70' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                viewMode === 'kanban'
                  ? darkMode 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista Kanban"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? darkMode 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filter Button - Compact with indicator */}
          <button
            onClick={onToggleFilters}
            className={`relative px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium ${
              showFilters
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                : darkMode
                  ? 'bg-gray-800/70 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {showFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            )}
          </button>
          
          {/* Analytics Button */}
          <button 
            className={`p-2 rounded-lg transition-all ${
              darkMode 
                ? 'hover:bg-gray-800/70 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          
          {/* Export Button */}
          <button 
            className={`p-2 rounded-lg transition-all ${
              darkMode 
                ? 'hover:bg-gray-800/70 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Exportar"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {/* Divider */}
          <div className={`h-6 w-px mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          
          {/* Add Lead Button - Primary action */}
          <button
            onClick={onAddLead}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Lead</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>
    </div>
  );
};