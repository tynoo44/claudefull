import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  LayoutGrid,
  Calendar,
} from 'lucide-react';

export type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'year';

interface CalendarNavigationProps {
  darkMode: boolean;
  currentView: ViewType;
  dateRangeLabel: string;
  onGoToToday: () => void;
  onNavigateDate: (direction: 'prev' | 'next') => void;
  onViewChange: (view: ViewType) => void;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  darkMode,
  currentView,
  dateRangeLabel,
  onGoToToday,
  onNavigateDate,
  onViewChange,
}) => {
  const viewOptions = [
    { key: 'month' as ViewType, label: 'Mes', icon: Grid3X3 },
    { key: 'week' as ViewType, label: 'Semana', icon: LayoutGrid },
    { key: 'day' as ViewType, label: 'Día', icon: Calendar },
    { key: 'agenda' as ViewType, label: 'Agenda', icon: List },
  ];

  return (
    <div
      className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Date navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onGoToToday}
          className={`px-3 py-1 rounded-lg border ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          } text-sm font-medium`}
        >
          Hoy
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateDate('prev')}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2
            className={`text-lg font-semibold min-w-[200px] text-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {dateRangeLabel}
          </h2>

          <button
            onClick={() => onNavigateDate('next')}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* View selector */}
      <div
        className={`flex items-center space-x-1 p-1 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        {viewOptions.map(view => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              onClick={() => onViewChange(view.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === view.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};