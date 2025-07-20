import React from 'react';
import {
  Users,
  Plus,
  Grid3X3,
  List,
  Download,
  BarChart3,
  Search,
  X,
  ChevronDown,
  MapPin,
  Activity,
} from 'lucide-react';
import { LeadStatus, LeadProcedence } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';

interface LeadsHeaderProps {
  darkMode: boolean;
  totalLeads: number;
  viewMode: 'list' | 'kanban';
  showFilters: boolean;
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  onAddLead: () => void;
  // Filter props
  searchTerm?: string;
  selectedTags?: string[];
  selectedStatus?: string;
  selectedProcedence?: string;
  availableTags?: string[];
  onSearchChange?: (term: string) => void;
  onTagToggle?: (tag: string) => void;
  onStatusChange?: (status: string) => void;
  onProcedenceChange?: (procedence: string) => void;
  onClearFilters?: () => void;
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
  'Lose',
];

const PROCEDENCE_OPTIONS: LeadProcedence[] = ['Outbound', 'Inbound', 'CTA', 'Spam'];

const PROCEDENCE_COLORS = {
  Outbound: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  Inbound: { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  CTA: { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  Spam: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
};

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  darkMode,
  totalLeads,
  viewMode,
  showFilters,
  onViewModeChange,
  onAddLead,
  // Filter props
  searchTerm = '',
  selectedTags = [],
  selectedStatus = 'all',
  selectedProcedence = 'all',
  availableTags = [],
  onSearchChange = () => {},
  onTagToggle = () => {},
  onStatusChange = () => {},
  onProcedenceChange = () => {},
  onClearFilters = () => {},
}) => {
  const hasActiveFilters =
    searchTerm ||
    selectedTags.length > 0 ||
    selectedStatus !== 'all' ||
    selectedProcedence !== 'all';

  return (
    <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Title & Stats */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl bg-gradient-to-br ${
              darkMode ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-500/10 to-purple-500/10'
            }`}
          >
            <Users className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Leads
            </h1>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {totalLeads} totales
            </span>
          </div>
        </div>

        {/* Center Section - Filters when active */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-1">
            {/* Search Bar */}
            <div className="relative max-w-sm">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-1.5 rounded-lg border transition-all text-sm ${
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
              <button
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                  selectedStatus !== 'all'
                    ? getStatusClasses(selectedStatus as LeadStatus, darkMode)
                    : darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {selectedStatus === 'all' ? 'Estado' : selectedStatus}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <div
                className={`absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 max-h-64 overflow-y-auto ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  onClick={() => onStatusChange('all')}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                    selectedStatus === 'all'
                      ? darkMode
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
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
                        ? darkMode
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Procedence Dropdown */}
            <div className="relative group">
              <button
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                  selectedProcedence !== 'all'
                    ? darkMode
                      ? PROCEDENCE_COLORS[selectedProcedence as LeadProcedence].dark
                      : PROCEDENCE_COLORS[selectedProcedence as LeadProcedence].light
                    : darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {selectedProcedence === 'all' ? 'Origen' : selectedProcedence}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <div
                className={`absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  onClick={() => onProcedenceChange('all')}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                    selectedProcedence === 'all'
                      ? darkMode
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
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
                        ? darkMode
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {proc}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags - Compact */}
            {availableTags.length > 0 && (
              <div className="flex items-center gap-1">
                {availableTags.slice(0, 3).map(tag => (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? darkMode
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-100 text-blue-700'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {availableTags.length > 3 && (
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    +{availableTags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
                  darkMode
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle - Compact */}
          <div className={`flex rounded-lg p-0.5 ${darkMode ? 'bg-gray-800/70' : 'bg-gray-100'}`}>
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
