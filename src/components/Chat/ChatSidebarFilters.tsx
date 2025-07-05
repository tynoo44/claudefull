import React from 'react';
import { Filter, Hash, SortAsc } from 'lucide-react';
import { LeadStatus, LeadProcedence } from '@/types';
import { getStatusClasses } from '../../utils/statusUtils';

interface ChatSidebarFiltersProps {
  darkMode: boolean;
  statusFilter: LeadStatus | null;
  procedenceFilter: LeadProcedence | null;
  sortBy: 'time' | 'name' | 'status' | 'unread' | 'start-date';
  sortAscending: boolean;
  showStatusDropdown: boolean;
  showProcedenceDropdown: boolean;
  showSortDropdown: boolean;
  onStatusFilterChange: (status: LeadStatus | null) => void;
  onProcedenceFilterChange: (procedence: LeadProcedence | null) => void;
  onSortChange: (sortBy: string, ascending: boolean) => void;
  onDropdownToggle: (dropdown: 'status' | 'procedence' | 'sort') => void;
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

const SORT_OPTIONS = [
  { value: 'time', label: 'Último mensaje', icon: '🕐' },
  { value: 'name', label: 'Nombre', icon: '👤' },
  { value: 'status', label: 'Estado', icon: '📊' },
  { value: 'unread', label: 'Sin responder', icon: '🔴' },
  { value: 'start-date', label: 'Fecha de inicio', icon: '📅' },
];

export const ChatSidebarFilters: React.FC<ChatSidebarFiltersProps> = ({
  darkMode,
  statusFilter,
  procedenceFilter,
  sortBy,
  sortAscending,
  showStatusDropdown,
  showProcedenceDropdown,
  showSortDropdown,
  onStatusFilterChange,
  onProcedenceFilterChange,
  onSortChange,
  onDropdownToggle,
}) => {
  return (
    <div className="flex gap-2 mb-2">
      {/* Status Filter */}
      <div className="relative">
        <button
          onClick={() => onDropdownToggle('status')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
            statusFilter
              ? `${getStatusClasses(statusFilter, darkMode)} border-transparent`
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {statusFilter || 'Estado'}
        </button>
        {showStatusDropdown && (
          <div
            className={`absolute top-full left-0 mt-1 min-w-[200px] rounded-lg border shadow-lg z-50 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <button
              onClick={() => {
                onStatusFilterChange(null);
                onDropdownToggle('status');
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                !statusFilter
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
                onClick={() => {
                  onStatusFilterChange(status);
                  onDropdownToggle('status');
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                  statusFilter === status
                    ? darkMode
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusClasses(status, darkMode).split(' ')[0]}`}
                  />
                  {status}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Procedence Filter */}
      <div className="relative">
        <button
          onClick={() => onDropdownToggle('procedence')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
            procedenceFilter
              ? procedenceFilter === 'Outbound'
                ? darkMode
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
                : procedenceFilter === 'Inbound'
                  ? darkMode
                    ? 'bg-green-600/20 text-green-400 border-green-500/30'
                    : 'bg-green-100 text-green-700 border-green-200'
                  : procedenceFilter === 'CTA'
                    ? darkMode
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                    : darkMode
                      ? 'bg-red-600/20 text-red-400 border-red-500/30'
                      : 'bg-red-100 text-red-700 border-red-200'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Hash className="w-4 h-4" />
          {procedenceFilter || 'Procedencia'}
        </button>
        {showProcedenceDropdown && (
          <div
            className={`absolute top-full left-0 mt-1 min-w-[150px] rounded-lg border shadow-lg z-50 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <button
              onClick={() => {
                onProcedenceFilterChange(null);
                onDropdownToggle('procedence');
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                !procedenceFilter
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
            {PROCEDENCE_OPTIONS.map(procedence => (
              <button
                key={procedence}
                onClick={() => {
                  onProcedenceFilterChange(procedence);
                  onDropdownToggle('procedence');
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                  procedenceFilter === procedence
                    ? darkMode
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      procedence === 'Outbound'
                        ? darkMode
                          ? 'bg-blue-400'
                          : 'bg-blue-600'
                        : procedence === 'Inbound'
                          ? darkMode
                            ? 'bg-green-400'
                            : 'bg-green-600'
                          : procedence === 'CTA'
                            ? darkMode
                              ? 'bg-purple-400'
                              : 'bg-purple-600'
                            : darkMode
                              ? 'bg-red-400'
                              : 'bg-red-600'
                    }`}
                  />
                  {procedence}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <div
          className={`flex items-center rounded-lg border text-sm transition-all ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-300'
              : 'bg-white border-gray-300 text-gray-700'
          }`}
        >
          <button
            onClick={() => onDropdownToggle('sort')}
            className={`flex items-center gap-2 px-3 py-2 flex-1 rounded-l-lg transition-colors ${
              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
            }`}
          >
            <SortAsc className="w-4 h-4" />
            {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
          </button>
          <div className={`w-px h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <button
            onClick={() => onSortChange(sortBy, !sortAscending)}
            className={`px-2 py-2 rounded-r-lg transition-colors ${
              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
            }`}
            title={sortAscending ? 'Cambiar a descendente' : 'Cambiar a ascendente'}
          >
            <span
              className={`text-xs opacity-60 ${sortAscending ? 'rotate-180' : ''} transition-transform block`}
            >
              ▼
            </span>
          </button>
        </div>
        {showSortDropdown && (
          <div
            className={`absolute top-full left-0 mt-1 min-w-[250px] rounded-lg border shadow-lg z-50 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {SORT_OPTIONS.map(option => (
              <div
                key={option.value}
                className={`flex items-center justify-between w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  sortBy === option.value
                    ? darkMode
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <button
                  onClick={() => {
                    onSortChange(option.value, option.value === 'name');
                    onDropdownToggle('sort');
                  }}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className="text-base">{option.icon}</span>
                  {option.label}
                </button>
                {sortBy === option.value && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSortChange(sortBy, !sortAscending);
                    }}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    title={sortAscending ? 'Cambiar a descendente' : 'Cambiar a ascendente'}
                  >
                    <span
                      className={`text-xs opacity-60 ${sortAscending ? 'rotate-180' : ''} transition-transform block`}
                    >
                      ▼
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
