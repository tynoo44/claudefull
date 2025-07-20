import React from 'react';
import { Clock, MapPin, Users, Calendar, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '../../types/calendar';

interface UpcomingEventsSidebarProps {
  events: CalendarEvent[];
  darkMode: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: () => void;
}

export const UpcomingEventsSidebar: React.FC<UpcomingEventsSidebarProps> = ({
  events,
  darkMode,
  onEventClick,
  onCreateEvent
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'tentative':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRelativeDate = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEEE d MMM', { locale: es });
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.start_datetime);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return Object.entries(grouped).map(([dateKey, events]) => ({
      date: new Date(dateKey + 'T00:00:00'),
      events: events.sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      )
    }));
  };

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-6">
      {/* Botón crear evento */}
      <button
        onClick={onCreateEvent}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Calendar className="h-4 w-4" />
        Crear Evento
      </button>

      {/* Próximos Eventos */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Próximos Eventos
        </h3>

        {groupedEvents.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay eventos próximos</p>
            <button
              onClick={onCreateEvent}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Crear tu primer evento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedEvents.map(({ date, events }) => (
              <div key={date.toISOString()}>
                {/* Fecha */}
                <div className={`text-sm font-medium mb-2 ${
                  isToday(date) 
                    ? 'text-blue-600' 
                    : darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {getRelativeDate(date)}
                </div>

                {/* Eventos del día */}
                <div className="space-y-2">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                        darkMode 
                          ? 'border-gray-700 bg-gray-700 hover:bg-gray-600' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`}></div>
                          <span className={`text-sm font-medium ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {event.is_all_day 
                              ? 'Todo el día' 
                              : format(new Date(event.start_datetime), 'HH:mm')
                            }
                          </span>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>

                      <h4 className={`text-sm font-medium mb-1 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h4>

                      {!event.is_all_day && (
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className={`h-3 w-3 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                          </span>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className={`h-3 w-3 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {event.location.length > 30 
                              ? `${event.location.substring(0, 30)}...` 
                              : event.location
                            }
                          </span>
                        </div>
                      )}

                      {event.attendees.length > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <Users className={`h-3 w-3 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {event.attendees.length} asistente{event.attendees.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {event.description && (
                        <p className={`text-xs mt-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {event.description.length > 80 
                            ? `${event.description.substring(0, 80)}...` 
                            : event.description
                          }
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas Rápidas */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Esta Semana
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total de eventos
            </span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {events.length}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Confirmados
            </span>
            <span className="font-medium text-green-500">
              {events.filter(e => e.status === 'confirmed').length}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Tentativo
            </span>
            <span className="font-medium text-yellow-500">
              {events.filter(e => e.status === 'tentative').length}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Cancelados
            </span>
            <span className="font-medium text-red-500">
              {events.filter(e => e.status === 'cancelled').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};