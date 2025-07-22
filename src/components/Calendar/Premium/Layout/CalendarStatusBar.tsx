import React from 'react';

interface CalendarStatusBarProps {
  darkMode: boolean;
  eventsCount: number;
  searchQuery: string;
  isLoading: boolean;
}

export const CalendarStatusBar: React.FC<CalendarStatusBarProps> = ({
  darkMode,
  eventsCount,
  searchQuery,
  isLoading,
}) => {
  return (
    <div
      className={`shrink-0 p-3 border-t ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      } flex items-center justify-between text-xs min-h-[48px]`}
    >
      <div className="flex items-center space-x-4">
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          {eventsCount} eventos cargados
        </span>
        {searchQuery && (
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Filtrado por: "{searchQuery}"
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span
          className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}
        />
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          {isLoading ? 'Sincronizando...' : 'Sincronizado'}
        </span>
      </div>
    </div>
  );
};