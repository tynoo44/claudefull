import React from 'react';
import { Calendar, Plus, Search, Settings, Sidebar, RefreshCw } from 'lucide-react';

interface CalendarToolbarProps {
  darkMode: boolean;
  searchQuery: string;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onToggleSettings: () => void;
  onCreateEvent: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  darkMode,
  searchQuery,
  isLoading,
  onToggleSidebar,
  onSearchChange,
  onRefresh,
  onToggleSettings,
  onCreateEvent,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          <Sidebar className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Calendar
          </h1>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            PRO
          </span>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            type="text"
            placeholder="Buscar eventos, personas, lugares..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          } ${isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleSettings}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>

        <button
          onClick={onCreateEvent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Crear</span>
        </button>
      </div>
    </div>
  );
};
