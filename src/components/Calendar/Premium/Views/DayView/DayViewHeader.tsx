import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Users, MapPin, TrendingUp } from 'lucide-react';
import type { CalendarEvent } from '../../../../../types/calendar';

interface DayViewHeaderProps {
  date: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  isToday: boolean;
}

export const DayViewHeader: React.FC<DayViewHeaderProps> = ({
  date,
  events,
  onDateClick,
  isToday
}) => {
  // Calculate day statistics
  const totalEvents = events.length;
  const allDayEvents = events.filter(e => e.is_all_day).length;
  const eventsWithAttendees = events.filter(e => e.attendees && e.attendees.length > 0).length;
  const eventsWithLocation = events.filter(e => e.location).length;
  
  // Calculate total meeting time
  const totalMeetingMinutes = events.reduce((total, event) => {
    if (event.is_all_day) return total;
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    return total + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  const totalMeetingHours = Math.round(totalMeetingMinutes / 60 * 10) / 10;

  // Get upcoming event
  const now = new Date();
  const upcomingEvent = events
    .filter(event => new Date(event.start_datetime) > now)
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];

  // Get current event
  const currentEvent = events.find(event => {
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    return now >= start && now <= end;
  });

  const formatEventTime = (event: CalendarEvent) => {
    if (event.is_all_day) return 'Todo el día';
    return format(new Date(event.start_datetime), 'HH:mm');
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
      {/* Main Date Display */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          onClick={() => onDateClick(date)}
        >
          <div className="flex items-center space-x-3">
            <div className={`text-4xl font-bold ${
              isToday 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {format(date, 'd')}
            </div>
            <div>
              <div className={`text-lg font-semibold ${
                isToday 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {format(date, 'EEEE', { locale: es })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {format(date, 'MMMM yyyy', { locale: es })}
              </div>
            </div>
          </div>
        </div>

        {/* Today Indicator */}
        {isToday && (
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
            Hoy
          </div>
        )}
      </div>

      {/* Day Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalEvents} eventos
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalMeetingHours}h reuniones
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {eventsWithAttendees} con asistentes
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {eventsWithLocation} con ubicación
            </span>
          </div>
        </div>
      </div>

      {/* Current/Upcoming Event Highlight */}
      {(currentEvent || upcomingEvent) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          {currentEvent ? (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  En curso
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {currentEvent.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{formatEventTime(currentEvent)}</span>
                {currentEvent.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{currentEvent.location}</span>
                  </span>
                )}
                {currentEvent.attendees && currentEvent.attendees.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{currentEvent.attendees.length}</span>
                  </span>
                )}
              </div>
            </div>
          ) : upcomingEvent ? (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Próximo evento
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {upcomingEvent.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{formatEventTime(upcomingEvent)}</span>
                {upcomingEvent.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{upcomingEvent.location}</span>
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* No Events State */}
      {totalEvents === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
            Sin eventos programados
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {isToday ? 'Tienes el día libre' : 'Un día tranquilo por delante'}
          </p>
        </div>
      )}
    </div>
  );
};