import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface LeadsFiltersProps {
  darkMode: boolean;
  searchTerm: string;
  selectedTags: string[];
  selectedStatus: string;
  availableTags: string[];
  onSearchChange: (term: string) => void;
  onTagToggle: (tag: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

export const LeadsFilters: React.FC<LeadsFiltersProps> = ({
  darkMode,
  searchTerm,
  selectedTags,
  selectedStatus,
  availableTags,
  onSearchChange,
  onTagToggle,
  onStatusChange,
  onClearFilters
}) => {
  const statuses = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'open', label: 'Nuevos' },
    { value: 'Follow UP', label: 'Seguimiento' },
    { value: 'Conectar y Cualificar', label: 'Cualificar' },
    { value: 'Situación Actual', label: 'Situación Actual' },
    { value: 'Situación Deseada', label: 'Situación Deseada' }
  ];

  const hasActiveFilters = searchTerm || selectedTags.length > 0 || selectedStatus !== 'all';

  return (
    <div className={`p-6 border-b space-y-4 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
      {/* Search and Status */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o notas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
        
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`appearance-none pl-4 pr-10 py-3 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Filtrar por tags
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters & Clear */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Filtros activos:
            </span>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  Búsqueda: "{searchTerm}"
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  Estado: {statuses.find(s => s.value === selectedStatus)?.label}
                </span>
              )}
              {selectedTags.map(tag => (
                <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tag}
                  <button onClick={() => onTagToggle(tag)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <button
            onClick={onClearFilters}
            className={`text-sm ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};