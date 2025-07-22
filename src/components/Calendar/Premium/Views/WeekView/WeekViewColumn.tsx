import React, { useMemo } from 'react';
import { WeekViewEvent } from './WeekViewEvent';
import type { CalendarEvent } from '../../../../../types/calendar';

interface WeekViewColumnProps {
  date: Date;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  hoveredEvent: string | null;
  calendarColors: Map<string, string>;
  timeSlots: number[];
  hourHeight: number;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventHover: (eventId: string | null) => void;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export const WeekViewColumn: React.FC<WeekViewColumnProps> = ({
  date,
  events,
  selectedEvents,
  hoveredEvent,
  calendarColors,
  timeSlots,
  hourHeight,
  onEventClick,
  onTimeSlotClick,
  onEventHover,
}) => {
  // Calculate positioned events with collision detection
  const positionedEvents = useMemo((): PositionedEvent[] => {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
    );

    const positioned: PositionedEvent[] = [];
    const columns: { end: number; events: PositionedEvent[] }[] = [];

    sortedEvents.forEach(event => {
      const start = new Date(event.start_datetime);
      const end = new Date(event.end_datetime);

      // Calculate position in pixels
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const duration = endHour - startHour;

      const top = startHour * hourHeight;
      const height = Math.max(duration * hourHeight, 20); // Minimum 20px height

      // Find available column or create new one
      let columnIndex = 0;
      const eventStart = start.getTime();

      while (columnIndex < columns.length) {
        if (columns[columnIndex].end <= eventStart) {
          break;
        }
        columnIndex++;
      }

      // Ensure column exists
      while (columns.length <= columnIndex) {
        columns.push({ end: 0, events: [] });
      }

      // Calculate width and left position based on overlapping events
      const totalColumns = Math.max(columns.length, columnIndex + 1);
      const width = 90 / totalColumns; // Percentage width
      const left = (columnIndex * 100) / totalColumns; // Percentage left

      const positionedEvent: PositionedEvent = {
        event,
        top,
        height,
        left,
        width,
        zIndex: 10 + columnIndex,
      };

      positioned.push(positionedEvent);
      columns[columnIndex].end = end.getTime();
      columns[columnIndex].events.push(positionedEvent);
    });

    return positioned;
  }, [events, hourHeight]);

  const handleTimeSlotClick = (hour: number) => {
    onTimeSlotClick(date, hour);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  };

  const handleEventHover = (eventId: string | null) => {
    onEventHover(eventId);
  };

  return (
    <div className="relative border-r border-gray-200 dark:border-gray-700 last:border-r-0">
      {/* Time slots grid */}
      {timeSlots.map(hour => (
        <div
          key={hour}
          className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
          style={{ height: `${hourHeight}px` }}
          onClick={() => handleTimeSlotClick(hour)}
        >
          {/* Half-hour line */}
          <div
            className="absolute left-0 right-0 border-t border-gray-50 dark:border-gray-700 pointer-events-none"
            style={{ top: `${hour * hourHeight + hourHeight / 2}px` }}
          />
        </div>
      ))}

      {/* Events overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {positionedEvents.map(({ event, top, height, left, width, zIndex }) => (
          <div
            key={event.id}
            className="absolute pointer-events-auto"
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: `${left}%`,
              width: `${width}%`,
              zIndex: selectedEvents.has(event.id) ? zIndex + 100 : zIndex,
            }}
          >
            <WeekViewEvent
              event={event}
              isSelected={selectedEvents.has(event.id)}
              isHovered={hoveredEvent === event.id}
              calendarColor={calendarColors.get(event.google_calendar_id) || '#3b82f6'}
              onClick={handleEventClick}
              onHover={handleEventHover}
              height={height}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
