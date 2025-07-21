import React, { useMemo } from 'react';
import { WeekViewEvent } from '../WeekView/WeekViewEvent';
import type { CalendarEvent } from '../../../../../types/calendar';

interface DayViewEventsProps {
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  hoveredEvent: string | null;
  calendarColors: Map<string, string>;
  hourHeight: number;
  onEventClick: (event: CalendarEvent) => void;
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

export const DayViewEvents: React.FC<DayViewEventsProps> = ({
  events,
  selectedEvents,
  hoveredEvent,
  calendarColors,
  hourHeight,
  onEventClick,
  onEventHover
}) => {
  // Calculate positioned events with advanced collision detection for day view
  const positionedEvents = useMemo((): PositionedEvent[] => {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );

    const positioned: PositionedEvent[] = [];
    const columns: { start: number; end: number; events: PositionedEvent[] }[] = [];

    sortedEvents.forEach(event => {
      const start = new Date(event.start_datetime);
      const end = new Date(event.end_datetime);
      
      // Calculate position in pixels
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const duration = endHour - startHour;
      
      const top = startHour * hourHeight;
      const height = Math.max(duration * hourHeight, 30); // Minimum 30px height for day view

      // Find available column with more sophisticated overlap detection
      let columnIndex = 0;
      const eventStart = start.getTime();
      const eventEnd = end.getTime();
      
      while (columnIndex < columns.length) {
        const column = columns[columnIndex];
        // Check if this event overlaps with any event in this column
        const hasOverlap = column.events.some(existingEvent => {
          const existingStart = new Date(existingEvent.event.start_datetime).getTime();
          const existingEnd = new Date(existingEvent.event.end_datetime).getTime();
          
          return !(eventEnd <= existingStart || eventStart >= existingEnd);
        });
        
        if (!hasOverlap) {
          break;
        }
        columnIndex++;
      }

      // Ensure column exists
      while (columns.length <= columnIndex) {
        columns.push({ start: eventStart, end: eventEnd, events: [] });
      }

      // Calculate width and left position with more spacing for readability
      const totalColumns = Math.max(columns.length, columnIndex + 1);
      const availableWidth = 95; // Leave 5% margin
      const gapWidth = totalColumns > 1 ? 2 : 0; // 2% gap between columns
      const columnWidth = (availableWidth - (totalColumns - 1) * gapWidth) / totalColumns;
      const left = 2.5 + columnIndex * (columnWidth + gapWidth); // 2.5% left margin

      const positionedEvent: PositionedEvent = {
        event,
        top,
        height,
        left,
        width: columnWidth,
        zIndex: 10 + columnIndex
      };

      positioned.push(positionedEvent);
      columns[columnIndex].events.push(positionedEvent);
      
      // Update column boundaries
      columns[columnIndex].start = Math.min(columns[columnIndex].start, eventStart);
      columns[columnIndex].end = Math.max(columns[columnIndex].end, eventEnd);
    });

    return positioned;
  }, [events, hourHeight]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  };

  const handleEventHover = (eventId: string | null) => {
    onEventHover(eventId);
  };

  // Group all-day events separately
  const allDayEvents = events.filter(event => event.is_all_day);
  const timedEvents = positionedEvents.filter(({ event }) => !event.is_all_day);

  return (
    <div className="absolute inset-0">
      {/* All-day events bar */}
      {allDayEvents.length > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 z-20">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Todo el día
          </div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                style={{
                  backgroundColor: `${calendarColors.get(event.google_calendar_id) || '#3b82f6'}20`,
                  borderLeft: `3px solid ${calendarColors.get(event.google_calendar_id) || '#3b82f6'}`,
                  color: calendarColors.get(event.google_calendar_id) || '#3b82f6'
                }}
                onClick={(e) => handleEventClick(event, e)}
                onMouseEnter={() => handleEventHover(event.id)}
                onMouseLeave={() => handleEventHover(null)}
              >
                <span className="font-medium">{event.title}</span>
                {event.location && (
                  <span className="ml-2 opacity-75">📍 {event.location}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timed events */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          top: allDayEvents.length > 0 ? `${60 + allDayEvents.length * 24}px` : '0px' 
        }}
      >
        {timedEvents.map(({ event, top, height, left, width, zIndex }) => (
          <div
            key={event.id}
            className="absolute pointer-events-auto"
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: `${left}%`,
              width: `${width}%`,
              zIndex: selectedEvents.has(event.id) ? zIndex + 100 : zIndex
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

      {/* Event overlap indicators */}
      {timedEvents.length > 0 && (
        <div className="absolute top-0 right-0 p-2 pointer-events-none">
          {positionedEvents.length > events.filter(e => !e.is_all_day).length * 0.7 && (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded shadow-sm">
              ⚠️ Eventos superpuestos
            </div>
          )}
        </div>
      )}
    </div>
  );
};