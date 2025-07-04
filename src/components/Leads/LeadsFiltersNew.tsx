import React from 'react';
import { Search, X, Tag, ChevronDown, MapPin, Activity } from 'lucide-react';
import { LeadStatus, LeadProcedence } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';

interface LeadsFiltersNewProps {
  darkMode: boolean;
  searchTerm: string;
  selectedTags: string[];
  selectedStatus: string;
  selectedProcedence: string;
  availableTags: string[];
  onSearchChange: (term: string) => void;
  onTagToggle: (tag: string) => void;
  onStatusChange: (status: string) => void;
  onProcedenceChange: (procedence: string) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: LeadStatus[] = [
  'Open',
  'Conectar y Cualificar',
  'Situación Actual',
  'Situación Deseada',
  'Obstáculo',
  'Compromiso',
  'Oferta',
  'Agenda',
  'Follow Up',
  'Freeze',
  'Lose'
];

const PROCEDENCE_OPTIONS: LeadProcedence[] = ['Outbound', 'Inbound', 'CTA', 'Spam'];

const PROCEDENCE_COLORS = {
  'Outbound': { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  'Inbound': { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  'CTA': { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  'Spam': { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' }
};

export const LeadsFiltersNew: React.FC<LeadsFiltersNewProps> = ({
  darkMode,
  searchTerm,
  selectedTags,
  selectedStatus,
  selectedProcedence,
  availableTags,
  onSearchChange,
  onTagToggle,
  onStatusChange,
  onProcedenceChange,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || selectedTags.length > 0 || selectedStatus !== 'all' || selectedProcedence !== 'all';

  return (
    <div className={`px-6 py-3 border-b space-y-3 ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* First Row - Search and Dropdowns */}
      <div className="flex items-center gap-3">
        {/* Search Bar - Flexible width */}
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o notas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all text-sm ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative group">
          <button className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
            selectedStatus !== 'all'
              ? getStatusClasses(selectedStatus as LeadStatus, darkMode)
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            <Activity className="w-4 h-4" />
            <span>{selectedStatus === 'all' ? 'Todos los estados' : selectedStatus}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 max-h-64 overflow-y-auto ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <button
              onClick={() => onStatusChange('all')}
              className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                selectedStatus === 'all'
                  ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              Todos los estados
            </button>
            {STATUS_OPTIONS.map(status => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                  selectedStatus === status
                    ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                    : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Procedence Dropdown */}
        <div className="relative group">
          <button className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
            selectedProcedence !== 'all'
              ? darkMode
                ? PROCEDENCE_COLORS[selectedProcedence as LeadProcedence].dark
                : PROCEDENCE_COLORS[selectedProcedence as LeadProcedence].light
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            <MapPin className="w-4 h-4" />
            <span>{selectedProcedence === 'all' ? 'Todas las procedencias' : selectedProcedence}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <button
              onClick={() => onProcedenceChange('all')}
              className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                selectedProcedence === 'all'
                  ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              Todas las procedencias
            </button>
            {PROCEDENCE_OPTIONS.map(proc => (
              <button
                key={proc}
                onClick={() => onProcedenceChange(proc)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                  selectedProcedence === proc
                    ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                    : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {proc}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
              darkMode
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <X className="w-4 h-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Second Row - Tags (Compact) */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Tag className="w-3 h-3 inline mr-1" />
            Tags:
          </span>
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTags.includes(tag)
                  ? darkMode
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
              {selectedTags.includes(tag) && (
                <X className="w-3 h-3 inline ml-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};