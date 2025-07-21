import React from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, Users, MoreHorizontal } from 'lucide-react';
import { MonthViewEvent } from './MonthViewEvent';
import type { CalendarEvent } from '../../../../../types/calendar';
import type { MultiCalendarState } from '../../../../../types/premium-calendar';

interface MonthViewDayProps {
  date: Date;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  hoveredEvent: string | null;
  calendarColors: Map<string, string>;
  multiCalendarSettings: MultiCalendarState;
  onEventClick: (event: CalendarEvent) => void;
  onEventHover: (eventId: string | null) => void;
  maxVisibleEvents?: number;
}

export const MonthViewDay: React.FC<MonthViewDayProps> = ({
  date,
  events,
  selectedEvents,
  hoveredEvent,
  calendarColors,
  multiCalendarSettings,
  onEventClick,
  onEventHover,
  maxVisibleEvents = 3,
}) => {
  const visibleEvents = events.slice(0, maxVisibleEvents);
  const hiddenEventsCount = Math.max(0, events.length - maxVisibleEvents);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent day click
    onEventClick(event);
  };

  const handleEventHover = (eventId: string | null) => {
    onEventHover(eventId);
  };

  const handleMoreEventsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Open day view or events popover
    console.log('Show more events for date:', date);
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 h-full">
      {/* Visible Events */}
      {visibleEvents.map(event => (
        <MonthViewEvent
          key={event.id}
          event={event}
          isSelected={selectedEvents.has(event.id)}
          isHovered={hoveredEvent === event.id}
          calendarColor={calendarColors.get(event.google_calendar_id) || '#3b82f6'}
          onClick={handleEventClick}
          onHover={handleEventHover}
        />
      ))}

      {/* More Events Indicator */}
      {hiddenEventsCount > 0 && (
        <button
          onClick={handleMoreEventsClick}
          className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <MoreHorizontal className="h-3 w-3 mr-1" />+{hiddenEventsCount} más
        </button>
      )}
    </div>
  );
};
