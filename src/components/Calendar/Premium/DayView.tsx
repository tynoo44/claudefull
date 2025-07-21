import React, { useMemo } from 'react';
import { format, isToday, addHours, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Clock, MapPin, Video, Users, Calendar as CalendarIcon } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: any[];
  calendars: Array<{ id: string; name: string; color: string; visible: boolean }>;
  selectedEvent: any | null;
  hoveredEvent: string | null;
  onEventClick: (event: any) => void;
  onEventHover: (eventId: string | null) => void;
  onTimeSlotClick: (date: Date, hour?: number) => void;
  darkMode: boolean;
  compactView?: boolean;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  calendars,
  selectedEvent,
  hoveredEvent,
  onEventClick,
  onEventHover,
  onTimeSlotClick,
  darkMode,
  compactView = false,
}) => {
  // Generate time slots (24 hours with 30-min intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({ hour, minute: 0, label: `${hour.toString().padStart(2, '0')}:00` });
      slots.push({ hour, minute: 30, label: `${hour.toString().padStart(2, '0')}:30` });
    }
    return slots;
  }, []);

  // Group events by time slots
  const eventsByTime = useMemo(() => {
    const grouped = new Map<string, any[]>();

    events.forEach(event => {
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      if (!calendar?.visible) return;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      // Check if event occurs on this day
      if (
        isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
        isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
        (eventStart < dayStart && eventEnd > dayEnd)
      ) {
        if (event.isAllDay) {
          // All-day events get special handling
          const key = 'all-day';
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(event);
        } else {
          // Regular events by hour and minute
          const startHour = eventStart.getHours();
          const startMinute = eventStart.getMinutes() >= 30 ? 30 : 0;
          const key = `${startHour}-${startMinute}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(event);
        }
      }
    });

    return grouped;
  }, [events, calendars, currentDate]);

  // Get calendar color
  const getCalendarColor = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    return calendar?.color || '#3b82f6';
  };

  // Render event
  const renderEvent = (event: any, isAllDay: boolean = false) => {
    const color = getCalendarColor(event.calendarId);
    const isHovered = hoveredEvent === event.id;
    const isSelected = selectedEvent?.id === event.id;

    const getEventIcon = () => {
      if (event.meetingLink) return <Video className="h-4 w-4" />;
      if (event.location) return <MapPin className="h-4 w-4" />;
      if (event.attendees && event.attendees.length > 0) return <Users className="h-4 w-4" />;
      return <Clock className="h-4 w-4" />;
    };

    const duration = event.isAllDay
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
          ${isAllDay ? 'p-3 mb-2' : 'p-2 mb-1'} rounded-lg cursor-pointer transition-all
          ${isHovered ? 'ring-2 ring-offset-2 transform scale-105 z-10' : ''}
          ${isSelected ? 'ring-2 ring-offset-2' : ''}
          ${darkMode ? 'ring-offset-gray-800' : 'ring-offset-white'}
        `}
        style={{
          backgroundColor: `${color}15`,
          borderLeft: `4px solid ${color}`,
          color: darkMode ? '#ffffff' : color,
          ringColor: color,
        }}
      >
        <div className="flex items-start space-x-3">
          {!compactView && (
            <div
              className="flex-shrink-0 p-2 rounded-lg"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {getEventIcon()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {event.title}
            </h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{duration}</p>
            {event.location && (
              <p
                className={`text-xs mt-1 flex items-center space-x-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>{event.location}</span>
              </p>
            )}
            {event.description && (
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                {event.description.length > 100
                  ? `${event.description.substring(0, 100)}...`
                  : event.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const allDayEvents = eventsByTime.get('all-day') || [];
  const today = isToday(currentDate);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Day header */}
      <div
        className={`shrink-0 p-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-2xl font-bold ${
                today
                  ? 'text-blue-600 dark:text-blue-400'
                  : darkMode
                    ? 'text-white'
                    : 'text-gray-900'
              }`}
            >
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {format(currentDate, 'yyyy')}
              {today && (
                <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  Hoy
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => onTimeSlotClick(currentDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo evento</span>
          </button>
        </div>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div
          className={`shrink-0 p-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-25'
          }`}
        >
          <h3
            className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Todo el día
          </h3>
          <div className="space-y-2">{allDayEvents.map(event => renderEvent(event, true))}</div>
        </div>
      )}

      {/* Time slots */}
      <div className="flex-1 overflow-auto">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {timeSlots.map(slot => {
            const slotEvents = eventsByTime.get(`${slot.hour}-${slot.minute}`) || [];
            const isHourStart = slot.minute === 0;

            return (
              <div
                key={`${slot.hour}-${slot.minute}`}
                className={`flex border-b ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                } ${isHourStart ? 'border-t-2' : ''}`}
              >
                {/* Time label */}
                <div
                  className={`w-20 shrink-0 p-3 text-right ${
                    darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
                  } ${isHourStart ? 'font-semibold' : 'text-sm'}`}
                >
                  {isHourStart ? slot.label : ''}
                </div>

                {/* Event area */}
                <div
                  onClick={() => onTimeSlotClick(currentDate, slot.hour)}
                  className={`flex-1 min-h-[40px] p-2 cursor-pointer transition-colors group ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Add event button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onTimeSlotClick(currentDate, slot.hour);
                    }}
                    className={`
                      float-right opacity-0 group-hover:opacity-100
                      p-1 rounded transition-opacity
                      ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
                    `}
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* Events */}
                  <div className="space-y-1">{slotEvents.map(event => renderEvent(event))}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day stats */}
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
            eventos hoy
          </span>
          <span>{format(currentDate, 'EEEE, dd MMM yyyy', { locale: es })}</span>
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
