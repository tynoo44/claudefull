import React, { useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  addHours,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Clock, MapPin, Video, Users } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  events: any[];
  calendars: Array<{ id: string; name: string; color: string; visible: boolean }>;
  selectedDate: Date | null;
  selectedEvent: any | null;
  hoveredEvent: string | null;
  onDateClick: (date: Date) => void;
  onEventClick: (event: any) => void;
  onEventHover: (eventId: string | null) => void;
  onTimeSlotClick: (date: Date, hour?: number) => void;
  darkMode: boolean;
  compactView?: boolean;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  calendars,
  selectedDate,
  selectedEvent,
  hoveredEvent,
  onDateClick,
  onEventClick,
  onEventHover,
  onTimeSlotClick,
  darkMode,
  compactView = false,
}) => {
  // Calculate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Generate time slots (24 hours)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Group events by day and hour
  const eventsByDayAndHour = useMemo(() => {
    const grouped = new Map<string, Map<number, any[]>>();

    events.forEach(event => {
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      if (!calendar?.visible) return;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Handle multi-day events
      weekDays.forEach(day => {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

        if (
          isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
          (eventStart < dayStart && eventEnd > dayEnd)
        ) {
          const dateKey = format(day, 'yyyy-MM-dd');

          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, new Map());
          }

          const dayMap = grouped.get(dateKey)!;

          if (event.isAllDay) {
            // All-day events go in hour 0
            if (!dayMap.has(0)) dayMap.set(0, []);
            dayMap.get(0)!.push({ ...event, isAllDayDisplay: true });
          } else {
            const startHour = eventStart.getHours();
            if (!dayMap.has(startHour)) dayMap.set(startHour, []);
            dayMap.get(startHour)!.push(event);
          }
        }
      });
    });

    return grouped;
  }, [events, calendars, weekDays]);

  // Get calendar color
  const getCalendarColor = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    return calendar?.color || '#3b82f6';
  };

  // Render event in time slot
  const renderEvent = (event: any) => {
    const color = getCalendarColor(event.calendarId);
    const isHovered = hoveredEvent === event.id;
    const isSelected = selectedEvent?.id === event.id;

    const getEventIcon = () => {
      if (event.meetingLink) return <Video className="h-3 w-3" />;
      if (event.location) return <MapPin className="h-3 w-3" />;
      if (event.attendees && event.attendees.length > 0) return <Users className="h-3 w-3" />;
      return <Clock className="h-3 w-3" />;
    };

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
          p-1 mb-1 rounded text-xs cursor-pointer transition-all
          ${event.isAllDayDisplay ? 'font-semibold' : ''}
          ${isHovered ? 'ring-2 ring-offset-1 transform scale-105 z-10' : ''}
          ${isSelected ? 'ring-2' : ''}
          ${darkMode ? 'ring-offset-gray-800' : 'ring-offset-white'}
        `}
        style={{
          backgroundColor: `${color}20`,
          borderLeft: `3px solid ${color}`,
          color: darkMode ? '#ffffff' : color,
          ringColor: color,
        }}
      >
        <div className="flex items-center space-x-1">
          {!compactView && getEventIcon()}
          <span className="truncate flex-1">
            {!event.isAllDayDisplay && !event.isAllDay && (
              <span className="opacity-75 mr-1">{format(new Date(event.start), 'HH:mm')}</span>
            )}
            {event.title}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Week header */}
      <div
        className={`shrink-0 grid grid-cols-8 gap-px border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
        }`}
      >
        {/* Time column header */}
        <div
          className={`p-3 text-center text-sm font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Hora
        </div>

        {/* Day headers */}
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            onClick={() => onDateClick(day)}
            className={`
              p-3 text-center cursor-pointer transition-colors
              ${selectedDate && isSameDay(day, selectedDate) ? 'bg-blue-100 dark:bg-blue-900' : ''}
              ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              hover:bg-gray-50 dark:hover:bg-gray-700
            `}
          >
            <div
              className={`text-sm font-semibold ${
                isToday(day)
                  ? 'text-blue-600 dark:text-blue-400'
                  : darkMode
                    ? 'text-gray-200'
                    : 'text-gray-900'
              }`}
            >
              {format(day, 'EEE', { locale: es })}
            </div>
            <div
              className={`text-lg ${
                isToday(day)
                  ? 'text-blue-600 dark:text-blue-400'
                  : darkMode
                    ? 'text-gray-300'
                    : 'text-gray-700'
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700">
          {timeSlots.map(hour => (
            <React.Fragment key={hour}>
              {/* Time slot label */}
              <div
                className={`
                p-2 text-right text-xs border-r
                ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}
              `}
              >
                {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
              </div>

              {/* Day columns for this hour */}
              {weekDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDayAndHour.get(dateKey);
                const hourEvents = dayEvents?.get(hour) || [];

                return (
                  <div
                    key={`${dateKey}-${hour}`}
                    onClick={() => onTimeSlotClick(day, hour)}
                    className={`
                      relative min-h-[60px] p-1 border cursor-pointer transition-colors group
                      ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                      hover:bg-gray-50 dark:hover:bg-gray-700
                    `}
                  >
                    {/* Add event button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onTimeSlotClick(day, hour);
                      }}
                      className={`
                        absolute top-1 right-1 opacity-0 group-hover:opacity-100
                        p-1 rounded transition-opacity
                        ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}
                      `}
                    >
                      <Plus className="h-3 w-3" />
                    </button>

                    {/* Events */}
                    <div className="space-y-1">{hourEvents.map(event => renderEvent(event))}</div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Week stats */}
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
            eventos esta semana
          </span>
          <span>
            {format(weekDays[0], 'dd MMM')} - {format(weekDays[6], 'dd MMM yyyy')}
          </span>
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
