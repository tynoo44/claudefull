import React, { useMemo, useRef, useEffect } from 'react';
import { startOfWeek, addDays, format, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeekViewColumn } from './WeekViewColumn';
import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';
import type { MultiCalendarState } from '../../../../../types/premium-calendar';

interface WeekViewGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  hoveredEvent: string | null;
  calendars: GoogleCalendar[];
  multiCalendarSettings: MultiCalendarState;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, timeSlot?: { start: Date; end: Date }) => void;
  onEventHover: (eventId: string | null) => void;
  daysToShow?: number;
  isLoading?: boolean;
}

// Time slots configuration
const HOUR_HEIGHT = 60; // pixels per hour
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours
const SCROLL_TO_HOUR = 8; // Scroll to 8 AM by default

export const WeekViewGrid: React.FC<WeekViewGridProps> = ({
  currentDate,
  events,
  selectedEvents,
  hoveredEvent,
  calendars,
  multiCalendarSettings,
  onEventClick,
  onDateClick,
  onTimeSlotClick,
  onEventHover,
  daysToShow = 7,
  isLoading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate week days
  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
  }, [currentDate, daysToShow]);

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

    return grouped;
  }, [events]);

  // Get calendar color mapping
  const calendarColors = useMemo(() => {
    const colors = new Map<string, string>();
    calendars.forEach(calendar => {
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

  // Auto-scroll to business hours on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTop = SCROLL_TO_HOUR * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTop = scrollTop;
    }
  }, []);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const timeSlot = {
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0),
    };
    onTimeSlotClick(date, timeSlot);
  };

  const getCurrentTimeIndicator = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const topPosition = (currentHour + currentMinute / 60) * HOUR_HEIGHT;

    return topPosition;
  };

  const showCurrentTimeIndicator = weekDays.some(day => isToday(day));

  return (
    <div className="week-view-grid h-full flex flex-col">
      {/* Header with dates */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="grid grid-cols-[80px_1fr]">
          {/* Empty corner for time column */}
          <div className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"></div>

          {/* Day headers */}
          <div className={`grid grid-cols-${daysToShow}`}>
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className="p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onDateClick(day)}
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {format(day, 'eee', { locale: es })}
                </div>
                <div
                  className={`text-lg font-semibold mt-1 ${
                    isToday(day)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time grid with events */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-white dark:bg-gray-800">
        <div className="relative">
          <div className="grid grid-cols-[80px_1fr] min-h-full">
            {/* Time column */}
            <div className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {TIME_SLOTS.map(hour => (
                <div
                  key={hour}
                  className="relative border-b border-gray-100 dark:border-gray-800 flex items-start justify-end pr-2 pt-1"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
                  </span>
                </div>
              ))}
            </div>

            {/* Days columns */}
            <div className={`grid grid-cols-${daysToShow} relative`}>
              {weekDays.map(day => (
                <WeekViewColumn
                  key={day.toISOString()}
                  date={day}
                  events={getEventsForDate(day)}
                  selectedEvents={selectedEvents}
                  hoveredEvent={hoveredEvent}
                  calendarColors={calendarColors}
                  timeSlots={TIME_SLOTS}
                  hourHeight={HOUR_HEIGHT}
                  onEventClick={onEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventHover={onEventHover}
                />
              ))}

              {/* Current time indicator */}
              {showCurrentTimeIndicator && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${getCurrentTimeIndicator()}px` }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                    <div className="flex-1 h-0.5 bg-red-500"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center z-30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Week Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {format(weekDays[0], 'dd MMM', { locale: es })} -{' '}
        {format(weekDays[weekDays.length - 1], 'dd MMM yyyy', { locale: es })} • {events.length}{' '}
        eventos
        {daysToShow !== 7 && ` • Vista de ${daysToShow} días`}
      </div>
    </div>
  );
};
