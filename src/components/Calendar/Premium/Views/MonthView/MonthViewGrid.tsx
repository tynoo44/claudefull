import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { MonthViewDay } from './MonthViewDay';
import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';
import type { MultiCalendarState } from '../../../../../types/premium-calendar';

interface MonthViewGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  hoveredEvent: string | null;
  calendars: GoogleCalendar[];
  multiCalendarSettings: MultiCalendarState;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onEventHover: (eventId: string | null) => void;
  isLoading?: boolean;
}

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const MonthViewGrid: React.FC<MonthViewGridProps> = ({
  currentDate,
  events,
  selectedEvents,
  hoveredEvent,
  calendars,
  multiCalendarSettings,
  onEventClick,
  onDateClick,
  onEventHover,
  isLoading = false,
}) => {
  // Calculate calendar grid dates
  const { calendarDays, monthStart, monthEnd } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    return { calendarDays, monthStart, monthEnd };
  }, [currentDate]);

  // Group events by date for efficient lookup
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    events.forEach(event => {
      const eventDate = format(new Date(event.start_datetime), 'yyyy-MM-dd');

      if (!grouped.has(eventDate)) {
        grouped.set(eventDate, []);
      }
      grouped.get(eventDate)!.push(event);
    });

    // Sort events within each day by start time
    grouped.forEach(dayEvents => {
      dayEvents.sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
      );
    });

    return grouped;
  }, [events]);

  // Get calendar color mapping
  const calendarColors = useMemo(() => {
    const colors = new Map<string, string>();
    calendars.forEach(calendar => {
      // Use calendar color_id or default colors
      const colorId = calendar.color_id || '1';
      const colorMap = {
        '1': '#3b82f6', // blue
        '2': '#ef4444', // red
        '3': '#f59e0b', // amber
        '4': '#10b981', // emerald
        '5': '#8b5cf6', // violet
        '6': '#f97316', // orange
        '7': '#06b6d4', // cyan
        '8': '#84cc16', // lime
        '9': '#ec4899', // pink
        '10': '#6b7280', // gray
      };
      colors.set(calendar.id, colorMap[colorId as keyof typeof colorMap] || '#3b82f6');
    });
    return colors;
  }, [calendars]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  };

  const isDayInCurrentMonth = (date: Date): boolean => {
    return isSameMonth(date, currentDate);
  };

  const isDaySelected = (date: Date): boolean => {
    return isSameDay(date, currentDate);
  };

  const getDayClassNames = (date: Date): string => {
    const baseClasses =
      'relative h-32 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors';
    const isCurrentMonth = isDayInCurrentMonth(date);
    const isTodayDate = isToday(date);
    const isSelected = isDaySelected(date);

    let classes = baseClasses;

    // Background colors
    if (isSelected) {
      classes += ' bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
    } else if (isCurrentMonth) {
      classes += ' bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
    } else {
      classes +=
        ' bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800';
    }

    // Today indicator
    if (isTodayDate) {
      classes += ' ring-2 ring-blue-500 ring-inset';
    }

    return classes;
  };

  const getDateDisplayClasses = (date: Date): string => {
    const baseClasses = 'text-sm font-medium p-2';
    const isCurrentMonth = isDayInCurrentMonth(date);
    const isTodayDate = isToday(date);

    let classes = baseClasses;

    if (isTodayDate) {
      classes += ' text-blue-600 dark:text-blue-400 font-bold';
    } else if (isCurrentMonth) {
      classes += ' text-gray-900 dark:text-gray-100';
    } else {
      classes += ' text-gray-400 dark:text-gray-600';
    }

    return classes;
  };

  return (
    <div className="month-view-grid h-full flex flex-col">
      {/* Header with days of the week */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {daysOfWeek.map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-0">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);

          return (
            <div key={index} className={getDayClassNames(date)} onClick={() => onDateClick(date)}>
              {/* Date Number */}
              <div className={getDateDisplayClasses(date)}>{format(date, 'd')}</div>

              {/* Events Container */}
              <div className="px-1 pb-1 overflow-hidden">
                <MonthViewDay
                  date={date}
                  events={dayEvents}
                  selectedEvents={selectedEvents}
                  hoveredEvent={hoveredEvent}
                  calendarColors={calendarColors}
                  multiCalendarSettings={multiCalendarSettings}
                  onEventClick={onEventClick}
                  onEventHover={onEventHover}
                  maxVisibleEvents={3}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Month Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {format(monthStart, 'MMMM yyyy', { locale: es })} • {events.length} eventos
        {multiCalendarSettings.selectedCalendars.size > 0 &&
          ` • ${multiCalendarSettings.selectedCalendars.size} calendarios seleccionados`}
      </div>
    </div>
  );
};
