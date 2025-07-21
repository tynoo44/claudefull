import React, { useMemo, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayViewEvents } from './DayViewEvents';
import { DayViewHeader } from './DayViewHeader';
import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';
import type { MultiCalendarState } from '../../../../../types/premium-calendar';

interface DayViewGridProps {
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
  isLoading?: boolean;
}

// Time slots configuration
const HOUR_HEIGHT = 80; // Larger for day view to show more detail
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i);
const SCROLL_TO_HOUR = 8; // Scroll to 8 AM by default

export const DayViewGrid: React.FC<DayViewGridProps> = ({
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
  isLoading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter events for the current day
  const dayEvents = useMemo(() => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = format(new Date(event.start_datetime), 'yyyy-MM-dd');
      return eventDate === dateKey;
    });
  }, [events, currentDate]);

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
  }, [currentDate]); // Re-scroll when date changes

  const handleTimeSlotClick = (hour: number) => {
    const timeSlot = {
      start: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        hour,
        0,
      ),
      end: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        hour + 1,
        0,
      ),
    };
    onTimeSlotClick(currentDate, timeSlot);
  };

  const getCurrentTimeIndicator = () => {
    if (!isToday(currentDate)) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const topPosition = (currentHour + currentMinute / 60) * HOUR_HEIGHT;

    return topPosition;
  };

  const currentTimePosition = getCurrentTimeIndicator();

  return (
    <div className="day-view-grid h-full flex flex-col">
      {/* Day Header */}
      <DayViewHeader
        date={currentDate}
        events={dayEvents}
        onDateClick={onDateClick}
        isToday={isToday(currentDate)}
      />

      {/* Time grid with events */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-white dark:bg-gray-800">
        <div className="relative min-h-full">
          <div className="grid grid-cols-[100px_1fr]">
            {/* Time column */}
            <div className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky left-0 z-10">
              {TIME_SLOTS.map(hour => (
                <div
                  key={hour}
                  className="relative border-b border-gray-100 dark:border-gray-800 flex items-start justify-end pr-3 pt-2"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {hour < 12 ? 'AM' : 'PM'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Day column with events */}
            <div className="relative">
              {/* Time slot grid */}
              {TIME_SLOTS.map(hour => (
                <div
                  key={hour}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors relative group"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  onClick={() => handleTimeSlotClick(hour)}
                >
                  {/* Quarter-hour lines */}
                  <div
                    className="absolute left-0 right-0 border-t border-gray-50 dark:border-gray-700 opacity-50"
                    style={{ top: `${HOUR_HEIGHT / 4}px` }}
                  />
                  <div
                    className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-600"
                    style={{ top: `${HOUR_HEIGHT / 2}px` }}
                  />
                  <div
                    className="absolute left-0 right-0 border-t border-gray-50 dark:border-gray-700 opacity-50"
                    style={{ top: `${(3 * HOUR_HEIGHT) / 4}px` }}
                  />

                  {/* Time slot hover indicator */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs text-blue-600 dark:text-blue-400 p-2 font-medium">
                      {hour === 0 ? '12:00 AM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}{' '}
                      -{' '}
                      {hour + 1 === 24
                        ? '12:00 AM'
                        : hour + 1 > 12
                          ? `${hour + 1 - 12}:00 PM`
                          : `${hour + 1}:00 AM`}
                    </div>
                  </div>
                </div>
              ))}

              {/* Events overlay */}
              <DayViewEvents
                events={dayEvents}
                selectedEvents={selectedEvents}
                hoveredEvent={hoveredEvent}
                calendarColors={calendarColors}
                hourHeight={HOUR_HEIGHT}
                onEventClick={onEventClick}
                onEventHover={onEventHover}
              />

              {/* Current time indicator */}
              {currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border-2 border-white shadow-sm"></div>
                    <div className="flex-1 h-0.5 bg-red-500 shadow-sm"></div>
                  </div>
                  <div className="absolute -top-2 left-4 text-xs font-medium text-red-500 bg-white dark:bg-gray-800 px-1 rounded shadow-sm">
                    {format(new Date(), 'HH:mm')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center z-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Day Info Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <span>{format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}</span>
          <span>
            {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
            {dayEvents.filter(e => e.attendees.length > 0).length > 0 &&
              ` • ${dayEvents.filter(e => e.attendees.length > 0).length} con asistentes`}
          </span>
        </div>
      </div>
    </div>
  );
};
