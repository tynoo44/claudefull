import React from 'react';
import { Calendar, RefreshCw, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { AuthService } from '../../lib/auth';
import type { GoogleCalendar } from '../../types/calendar';

interface GoogleCalendarConnectProps {
  calendars: GoogleCalendar[];
  hasGoogleAccess: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  darkMode: boolean;
  onSync: () => void;
  onSelectCalendar: (calendarId: string) => void;
  selectedCalendarId: string;
}

export const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  calendars,
  hasGoogleAccess,
  isLoading,
  isSyncing,
  darkMode,
  onSync,
  onSelectCalendar,
  selectedCalendarId
}) => {
  const handleReAuth = async () => {
    try {
      // First sign out
      await AuthService.signOut();
      // Then sign in again with Calendar scopes
      await AuthService.signInWithGoogle();
    } catch (error) {
      console.error('Error re-authenticating:', error);
    }
  };

  if (!hasGoogleAccess) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <div className="text-center">
          <Shield className={`h-12 w-12 mx-auto mb-4 text-yellow-500`} />
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Permisos de Calendar Requeridos
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Necesitas volver a autorizar tu cuenta de Google para acceder al calendario.
          </p>
          <button
            onClick={handleReAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-3"
          >
            Re-autorizar con Google
          </button>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Se abrirá la ventana de Google para autorizar permisos de Calendar
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Cargando calendarios...
          </span>
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
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                selectedCalendarId === calendar.google_calendar_id
                  ? darkMode 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-blue-500 bg-blue-50'
                  : darkMode 
                    ? 'border-gray-700 bg-gray-700 hover:bg-gray-600' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => onSelectCalendar(calendar.google_calendar_id)}
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
                {selectedCalendarId === calendar.google_calendar_id && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  calendar.access_role === 'owner' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                }`}>
                  {calendar.access_role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conectado con Google Calendar
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Los cambios se sincronizan automáticamente con tu cuenta de Google
            </p>
          </div>
        </div>
      </div>
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