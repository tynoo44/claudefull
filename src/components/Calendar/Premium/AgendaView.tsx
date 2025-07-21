import React, { useMemo } from 'react';
import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  endOfDay,
  addDays,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Clock,
  MapPin,
  Video,
  Users,
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  Filter,
} from 'lucide-react';

interface AgendaViewProps {
  currentDate: Date;
  events: any[];
  calendars: Array<{ id: string; name: string; color: string; visible: boolean }>;
  selectedEvent: any | null;
  hoveredEvent: string | null;
  onEventClick: (event: any) => void;
  onEventHover: (eventId: string | null) => void;
  onTimeSlotClick: (date: Date, hour?: number) => void;
  darkMode: boolean;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  currentDate,
  events,
  calendars,
  selectedEvent,
  hoveredEvent,
  onEventClick,
  onEventHover,
  onTimeSlotClick,
  darkMode,
}) => {
  // Generate next 30 days from current date
  const agendaDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      days.push(addDays(currentDate, i));
    }
    return days;
  }, [currentDate]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, any[]>();

    events.forEach(event => {
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      if (!calendar?.visible) return;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check which days this event appears on
      agendaDays.forEach(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        if (
          isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
          (eventStart < dayStart && eventEnd > dayEnd)
        ) {
          const dateKey = format(day, 'yyyy-MM-dd');
          if (!grouped.has(dateKey)) grouped.set(dateKey, []);
          grouped.get(dateKey)!.push(event);
        }
      });
    });

    // Sort events by start time within each day
    grouped.forEach(dayEvents => {
      dayEvents.sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
    });

    return grouped;
  }, [events, calendars, agendaDays]);

  // Get calendar color
  const getCalendarColor = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    return calendar?.color || '#3b82f6';
  };

  // Get day label
  const getDayLabel = (day: Date) => {
    if (isToday(day)) return 'Hoy';
    if (isTomorrow(day)) return 'Mañana';
    if (isYesterday(day)) return 'Ayer';
    return format(day, "EEEE, d 'de' MMMM", { locale: es });
  };

  // Render event
  const renderEvent = (event: any) => {
    const color = getCalendarColor(event.calendarId);
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    const isHovered = hoveredEvent === event.id;
    const isSelected = selectedEvent?.id === event.id;

    const getEventIcon = () => {
      if (event.meetingLink) return <Video className="h-4 w-4" />;
      if (event.location) return <MapPin className="h-4 w-4" />;
      if (event.attendees && event.attendees.length > 0) return <Users className="h-4 w-4" />;
      return <Clock className="h-4 w-4" />;
    };

    const timeDisplay = event.isAllDay
      ? 'Todo el día'
      : `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`;

    return (
      <div
        key={event.id}
        onClick={e => {
          e.stopPropagation();
          onEventClick(event);
        }}
        onMouseEnter={() => onEventHover(event.id)}
        onMouseLeave={() => onEventHover(null)}
        className={`
          group p-4 rounded-lg cursor-pointer transition-all border-l-4
          ${isHovered ? 'ring-2 ring-offset-2 transform scale-[1.02] z-10' : ''}
          ${isSelected ? 'ring-2 ring-offset-2' : ''}
          ${
            darkMode
              ? 'bg-gray-800 hover:bg-gray-750 ring-offset-gray-900'
              : 'bg-white hover:bg-gray-50 ring-offset-white border border-gray-200'
          }
        `}
        style={{
          borderLeftColor: color,
        }}
      >
        <div className="flex items-start space-x-3">
          {/* Event icon */}
          <div
            className="flex-shrink-0 p-2 rounded-lg"
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {getEventIcon()}
          </div>

          {/* Event details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {event.title}
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {timeDisplay}
                </p>
              </div>
              <ChevronRight
                className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              />
            </div>

            {/* Additional details */}
            <div className="mt-3 space-y-2">
              {event.location && (
                <div
                  className={`flex items-center space-x-2 text-sm ${
                    darkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {event.attendees && event.attendees.length > 0 && (
                <div
                  className={`flex items-center space-x-2 text-sm ${
                    darkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>
                    {event.attendees.length} asistente{event.attendees.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {calendar && (
                <div className="flex items-center space-x-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className={darkMode ? 'text-gray-500' : 'text-gray-600'}>
                    {calendar.name}
                  </span>
                </div>
              )}

              {event.description && (
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {event.description.length > 150
                    ? `${event.description.substring(0, 150)}...`
                    : event.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter days that have events
  const daysWithEvents = agendaDays.filter(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsByDay.has(dateKey);
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Agenda header */}
      <div
        className={`shrink-0 p-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Próximos eventos
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Próximos 30 días
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
            <button
              onClick={() => onTimeSlotClick(new Date())}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo evento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-auto">
        {daysWithEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <CalendarIcon
              className={`h-24 w-24 mb-6 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
            <h3
              className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              No hay eventos próximos
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Tu agenda está libre los próximos 30 días
            </p>
            <button
              onClick={() => onTimeSlotClick(new Date())}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Crear primer evento</span>
            </button>
          </div>
        ) : (
          <div className={`p-4 space-y-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {daysWithEvents.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(dateKey) || [];

              return (
                <div key={dateKey} className="space-y-4">
                  {/* Day header */}
                  <div className="flex items-center space-x-3">
                    <h3
                      className={`text-lg font-semibold ${
                        isToday(day)
                          ? 'text-blue-600 dark:text-blue-400'
                          : darkMode
                            ? 'text-white'
                            : 'text-gray-900'
                      }`}
                    >
                      {getDayLabel(day)}
                    </h3>
                    {!isToday(day) && !isTomorrow(day) && !isYesterday(day) && (
                      <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        {format(day, 'yyyy')}
                      </span>
                    )}
                    <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Day events */}
                  <div className="space-y-3">{dayEvents.map(event => renderEvent(event))}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agenda stats */}
      <div
        className={`shrink-0 p-2 text-xs border-t flex items-center justify-between ${
          darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}
      >
        <div className="flex items-center space-x-4">
          <span>
            {
              events.filter(e => {
                const cal = calendars.find(c => c.id === e.calendarId);
                return cal?.visible;
              }).length
            }{' '}
            eventos próximos
          </span>
          <span>{daysWithEvents.length} días con eventos</span>
        </div>
        <div className="flex items-center space-x-2">
          {calendars
            .filter(c => c.visible)
            .map(calendar => (
              <div key={calendar.id} className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendar.color }} />
                <span className="hidden md:inline">{calendar.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
