import React from 'react';
import { Calendar, RefreshCw, Plus, Settings } from 'lucide-react';
import type { GoogleCalendar } from '../../types/calendar';

interface GoogleCalendarConnectProps {
  calendars: GoogleCalendar[];
  isConnected: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  darkMode: boolean;
  onConnect: () => void;
  onSync: () => void;
  onToggleCalendar: (calendarId: string, visible: boolean) => void;
}

export const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  calendars,
  isConnected,
  isConnecting,
  isSyncing,
  darkMode,
  onConnect,
  onSync,
  onToggleCalendar
}) => {
  if (!isConnected) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <div className="text-center">
          <Calendar className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Conectar Google Calendar
          </h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Conecta tu cuenta de Google para sincronizar tus calendarios y eventos
          </p>
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Conectar Google Calendar
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Mis Calendarios
        </h3>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
          title="Sincronizar calendarios"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {calendars.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className={`h-8 w-8 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No se encontraron calendarios
          </p>
          <button
            onClick={onSync}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Sincronizar ahora
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {calendars.map(calendar => (
            <div
              key={calendar.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                darkMode 
                  ? 'border-gray-700 bg-gray-700' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: getCalendarColor(calendar.color_id) }}
                />
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {calendar.name}
                    {calendar.is_primary && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                  {calendar.description && (
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {calendar.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  calendar.access_role === 'owner' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                }`}>
                  {calendar.access_role}
                </span>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calendar.is_visible}
                    onChange={(e) => onToggleCalendar(calendar.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get calendar color
function getCalendarColor(colorId?: string): string {
  const colors: Record<string, string> = {
    '1': '#7986CB', // Lavender
    '2': '#33B679', // Sage
    '3': '#8E24AA', // Grape
    '4': '#E67C73', // Flamingo
    '5': '#F6BF26', // Banana
    '6': '#F4511E', // Tangerine
    '7': '#039BE5', // Peacock
    '8': '#9E9E9E', // Graphite
    '9': '#795548', // Blueberry
    '10': '#7CB342', // Basil
    '11': '#C0CA33', // Avocado
  };
  
  return colors[colorId || '1'] || '#1976D2';
}