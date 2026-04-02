import React from 'react';
import {
  Filter,
  MapPin,
  ArrowUpDown,
  Clock,
  User,
  BarChart3,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
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
  { value: 'time', label: 'Reciente', Icon: Clock },
  { value: 'name', label: 'Nombre', Icon: User },
  { value: 'status', label: 'Estado', Icon: BarChart3 },
  { value: 'unread', label: 'Sin leer', Icon: AlertCircle },
  { value: 'start-date', label: 'Fecha', Icon: CalendarDays },
];

const PROCEDENCE_COLORS: Record<LeadProcedence, { light: string; dark: string }> = {
  Outbound: { light: 'bg-blue-50 text-blue-700', dark: 'bg-blue-600/20 text-blue-400' },
  Inbound: { light: 'bg-green-50 text-green-700', dark: 'bg-green-600/20 text-green-400' },
  CTA: { light: 'bg-purple-50 text-purple-700', dark: 'bg-purple-600/20 text-purple-400' },
  Spam: { light: 'bg-red-50 text-red-700', dark: 'bg-red-600/20 text-red-400' },
};

const PROCEDENCE_DOT: Record<LeadProcedence, { light: string; dark: string }> = {
  Outbound: { light: 'bg-blue-500', dark: 'bg-blue-400' },
  Inbound: { light: 'bg-green-500', dark: 'bg-green-400' },
  CTA: { light: 'bg-purple-500', dark: 'bg-purple-400' },
  Spam: { light: 'bg-red-500', dark: 'bg-red-400' },
};

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
  const activeSort = SORT_OPTIONS.find(opt => opt.value === sortBy);
  const SortIcon = activeSort?.Icon || Clock;

  const chipInactive = (isOpen: boolean) =>
    isOpen
      ? darkMode
        ? 'bg-gray-600 text-white'
        : 'bg-gray-200 text-gray-800'
      : darkMode
        ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  const dropdownCls = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  const itemCls = (active: boolean) =>
    active
      ? darkMode
        ? 'bg-blue-600/15 text-blue-400'
        : 'bg-blue-50 text-blue-600'
      : darkMode
        ? 'text-gray-300 hover:bg-gray-700/70'
        : 'text-gray-700 hover:bg-gray-50';

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {/* Status Filter */}
      <div className="relative">
        <button
          onClick={() => onDropdownToggle('status')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter
              ? getStatusClasses(statusFilter, darkMode)
              : chipInactive(showStatusDropdown)
          }`}
        >
          <Filter className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[70px]">{statusFilter || 'Estado'}</span>
        </button>
        {showStatusDropdown && (
          <div
            className={`absolute top-full left-0 mt-1.5 w-52 rounded-xl border shadow-xl z-50 py-1 max-h-60 overflow-y-auto ${dropdownCls}`}
          >
            <button
              onClick={() => {
                onStatusFilterChange(null);
                onDropdownToggle('status');
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${itemCls(!statusFilter)}`}
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
                className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${itemCls(statusFilter === status)}`}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusClasses(status, darkMode).split(' ')[0]}`}
                />
                <span className="truncate">{status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Procedence Filter */}
      <div className="relative">
        <button
          onClick={() => onDropdownToggle('procedence')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            procedenceFilter
              ? darkMode
                ? PROCEDENCE_COLORS[procedenceFilter].dark
                : PROCEDENCE_COLORS[procedenceFilter].light
              : chipInactive(showProcedenceDropdown)
          }`}
        >
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[60px]">{procedenceFilter || 'Origen'}</span>
        </button>
        {showProcedenceDropdown && (
          <div
            className={`absolute top-full left-0 mt-1.5 w-44 rounded-xl border shadow-xl z-50 py-1 ${dropdownCls}`}
          >
            <button
              onClick={() => {
                onProcedenceFilterChange(null);
                onDropdownToggle('procedence');
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${itemCls(!procedenceFilter)}`}
            >
              Todos
            </button>
            {PROCEDENCE_OPTIONS.map(proc => (
              <button
                key={proc}
                onClick={() => {
                  onProcedenceFilterChange(proc);
                  onDropdownToggle('procedence');
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${itemCls(procedenceFilter === proc)}`}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${darkMode ? PROCEDENCE_DOT[proc].dark : PROCEDENCE_DOT[proc].light}`}
                />
                {proc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort - aligned right */}
      <div className="relative ml-auto">
        <button
          onClick={() => onDropdownToggle('sort')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${chipInactive(showSortDropdown)}`}
        >
          <SortIcon className="w-3 h-3 flex-shrink-0" />
          <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
        </button>
        {showSortDropdown && (
          <div
            className={`absolute top-full right-0 mt-1.5 w-44 rounded-xl border shadow-xl z-50 py-1 ${dropdownCls}`}
          >
            {SORT_OPTIONS.map(option => {
              const OptIcon = option.Icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(
                      option.value,
                      option.value === sortBy ? !sortAscending : option.value === 'name',
                    );
                    onDropdownToggle('sort');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2.5 ${itemCls(sortBy === option.value)}`}
                >
                  <OptIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{option.label}</span>
                  {sortBy === option.value && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
