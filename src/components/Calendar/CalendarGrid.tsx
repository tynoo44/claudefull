import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
import {
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent, CalendarView } from '../../types/calendar';

interface CalendarGridProps {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  darkMode: boolean;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  view,
  events,
  darkMode,
  onDateClick,
  onEventClick,
}) => {
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = format(new Date(event.start_datetime), 'yyyy-MM-dd');
      return eventDate === dateStr;
    });
  };

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

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Header de días de la semana */}
        {daysOfWeek.map(day => (
          <div
            key={day}
            className={`p-3 text-center text-sm font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Días del calendario */}
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border cursor-pointer transition-colors ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } ${
                isCurrentMonth
                  ? darkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white hover:bg-gray-50'
                  : darkMode
                    ? 'bg-gray-900 hover:bg-gray-800'
                    : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => onDateClick(date)}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  isTodayDate
                    ? 'text-blue-600 font-bold'
                    : isCurrentMonth
                      ? darkMode
                        ? 'text-white'
                        : 'text-gray-900'
                      : darkMode
                        ? 'text-gray-500'
                        : 'text-gray-400'
                }`}
              >
                {format(date, 'd')}
              </div>

              {/* Eventos del día */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded text-white cursor-pointer ${getStatusColor(event.status)} 
                               hover:opacity-80 transition-opacity`}
                    onClick={e => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="truncate">
                        {event.is_all_day
                          ? 'Todo el día'
                          : format(new Date(event.start_datetime), 'HH:mm')}
                      </span>
                    </div>
                    <div className="truncate font-medium">{event.title}</div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} cursor-pointer hover:underline`}
                    onClick={e => {
                      e.stopPropagation();
                      onDateClick(date);
                    }}
                  >
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full">
        {/* Header con días de la semana */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div className="p-4"></div> {/* Espacio para la columna de horas */}
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-4 text-center">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {format(day, 'eee', { locale: es })}
              </div>
              <div
                className={`text-lg font-semibold ${
                  isToday(day) ? 'text-blue-600' : darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Grilla de horas */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-h-full">
            {/* Columna de horas */}
            <div className="border-r border-gray-200 dark:border-gray-700">
              {hours.map(hour => (
                <div key={hour} className="h-16 flex items-start justify-end pr-2 pt-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day);
              return (
                <div
                  key={day.toISOString()}
                  className="border-r border-gray-200 dark:border-gray-700 relative"
                >
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className={`h-16 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                      onClick={() => onDateClick(day)}
                    />
                  ))}

                  {/* Eventos posicionados */}
                  {dayEvents.map(event => {
                    const startHour = new Date(event.start_datetime).getHours();
                    const startMinute = new Date(event.start_datetime).getMinutes();
                    const duration =
                      (new Date(event.end_datetime).getTime() -
                        new Date(event.start_datetime).getTime()) /
                      (1000 * 60 * 60);

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded text-white text-xs p-1 cursor-pointer ${getStatusColor(event.status)} 
                                   hover:opacity-80 transition-opacity z-10`}
                        style={{
                          top: `${(startHour + startMinute / 60) * 64}px`,
                          height: `${Math.max(duration * 64, 20)}px`,
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs opacity-80">
                            <MapPin className="h-2 w-2" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="flex flex-col h-full">
        {/* Header del día */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center">
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {format(currentDate, 'EEEE', { locale: es })}
            </div>
            <div
              className={`text-2xl font-bold ${
                isToday(currentDate) ? 'text-blue-600' : darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {format(currentDate, 'd MMMM yyyy', { locale: es })}
            </div>
          </div>
        </div>

        {/* Lista de eventos y grilla de horas */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Columna de horas */}
            <div className="w-20 border-r border-gray-200 dark:border-gray-700">
              {hours.map(hour => (
                <div key={hour} className="h-16 flex items-start justify-end pr-2 pt-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Área de eventos */}
            <div className="flex-1 relative">
              {hours.map(hour => (
                <div
                  key={hour}
                  className={`h-16 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                  onClick={() => onDateClick(currentDate)}
                />
              ))}

              {/* Eventos posicionados */}
              {dayEvents.map(event => {
                const startHour = new Date(event.start_datetime).getHours();
                const startMinute = new Date(event.start_datetime).getMinutes();
                const duration =
                  (new Date(event.end_datetime).getTime() -
                    new Date(event.start_datetime).getTime()) /
                  (1000 * 60 * 60);

                return (
                  <div
                    key={event.id}
                    className={`absolute left-2 right-2 rounded text-white p-2 cursor-pointer ${getStatusColor(event.status)} 
                               hover:opacity-80 transition-opacity z-10`}
                    style={{
                      top: `${(startHour + startMinute / 60) * 64}px`,
                      height: `${Math.max(duration * 64, 40)}px`,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm opacity-90">
                      {format(new Date(event.start_datetime), 'HH:mm')} -{' '}
                      {format(new Date(event.end_datetime), 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm opacity-80">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.attendees.length > 0 && (
                      <div className="flex items-center gap-1 text-sm opacity-80">
                        <Users className="h-3 w-3" />
                        <span>{event.attendees.length} asistentes</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  switch (view) {
    case 'week':
      return renderWeekView();
    case 'day':
      return renderDayView();
    default:
      return renderMonthView();
  }
};
