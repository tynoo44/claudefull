import React, { useState } from 'react';
import {
  Users,
  Plus,
  Grid3X3,
  List,
  Search,
  X,
  ChevronDown,
  MapPin,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { LeadStatus, LeadProcedence } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';
import { TagsDropdown } from '../common/TagsDropdown';

interface LeadsHeaderProps {
  darkMode: boolean;
  totalLeads: number;
  viewMode: 'list' | 'kanban';
  showFilters: boolean;
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  onAddLead: () => void;
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
  onToggleFilters?: () => void;
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
  onViewModeChange,
  onAddLead,
  searchTerm = '',
  selectedTags = [],
  selectedStatus = 'all',
  selectedProcedence = 'all',
  onSearchChange = () => {},
  onTagToggle = () => {},
  onStatusChange = () => {},
  onProcedenceChange = () => {},
  onClearFilters = () => {},
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    searchTerm ||
    selectedTags.length > 0 ||
    selectedStatus !== 'all' ||
    selectedProcedence !== 'all';

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    selectedTags.length +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedProcedence !== 'all' ? 1 : 0);

  return (
    <div
      className={`px-4 sm:px-6 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
    >
      {/* Main row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left - Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Users className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Leads
            </h1>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {totalLeads} totales
            </span>
          </div>
        </div>

        {/* Center - Search (desktop only) */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 max-w-sm">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-8 py-2 rounded-lg border text-sm transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-400'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative group">
            <button
              className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                selectedStatus !== 'all'
                  ? getStatusClasses(selectedStatus as LeadStatus, darkMode)
                  : darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">
                {selectedStatus === 'all' ? 'Estado' : selectedStatus}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div
              className={`absolute top-full left-0 mt-1 w-52 rounded-xl border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 max-h-72 overflow-y-auto ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <button
                onClick={() => onStatusChange('all')}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl ${
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
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors last:rounded-b-xl ${
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

          {/* Procedence filter */}
          <div className="relative group">
            <button
              className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                selectedProcedence !== 'all'
                  ? darkMode
                    ? PROCEDENCE_COLORS[selectedProcedence as LeadProcedence].dark
                    : PROCEDENCE_COLORS[selectedProcedence as LeadProcedence].light
                  : darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">
                {selectedProcedence === 'all' ? 'Origen' : selectedProcedence}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div
              className={`absolute top-full left-0 mt-1 w-44 rounded-xl border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <button
                onClick={() => onProcedenceChange('all')}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl ${
                  selectedProcedence === 'all'
                    ? darkMode
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Todos los origenes
              </button>
              {PROCEDENCE_OPTIONS.map(proc => (
                <button
                  key={proc}
                  onClick={() => onProcedenceChange(proc)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors last:rounded-b-xl ${
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

          {/* Tags */}
          <TagsDropdown
            selectedTags={selectedTags}
            onToggleTag={onTagToggle}
            onClearTags={() => {
              selectedTags.forEach(tag => onTagToggle(tag));
            }}
          />

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={`px-2.5 py-2 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
                darkMode
                  ? 'bg-red-600/15 text-red-400 hover:bg-red-600/25'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`md:hidden relative p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div
            className={`hidden sm:flex rounded-lg p-0.5 ${darkMode ? 'bg-gray-800/70' : 'bg-gray-100'}`}
          >
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                viewMode === 'kanban'
                  ? darkMode
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
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
                    : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div
            className={`hidden sm:block h-6 w-px mx-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          />

          {/* Add Lead */}
          <button
            onClick={onAddLead}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Lead</span>
          </button>
        </div>
      </div>

      {/* Mobile filters panel */}
      {showMobileFilters && (
        <div
          className={`md:hidden mt-3 pt-3 border-t space-y-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          {/* Search */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {/* Status pills */}
            <select
              value={selectedStatus}
              onChange={e => onStatusChange(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">Todos los estados</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={selectedProcedence}
              onChange={e => onProcedenceChange(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">Todos los origenes</option>
              {PROCEDENCE_OPTIONS.map(proc => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
            </select>

            {/* View toggle in mobile */}
            <div
              className={`flex rounded-lg p-0.5 sm:hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  viewMode === 'kanban'
                    ? darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  viewMode === 'list'
                    ? darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : darkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                Lista
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  darkMode ? 'bg-red-600/15 text-red-400' : 'bg-red-50 text-red-600'
                }`}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
