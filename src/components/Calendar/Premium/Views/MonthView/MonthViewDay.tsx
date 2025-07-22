import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { Clock, Plus, MoreHorizontal } from 'lucide-react';
import { DraggableMonthEvent } from './DraggableMonthEvent';
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
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  maxVisibleEvents?: number;
  // Additional props for day cell behavior
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  darkMode: boolean;
  onDateClick: () => void;
  onTimeSlotClick: () => void;
}

export const MonthViewDay: React.FC<MonthViewDayProps> = ({
  date,
  events,
  selectedEvents,
  hoveredEvent,
  calendarColors,
  multiCalendarSettings: _multiCalendarSettings,
  onEventClick,
  onEventHover,
  onEventUpdate = async () => {},
  maxVisibleEvents = 3,
  // Additional props
  isCurrentMonth,
  isSelected,
  isToday,
  darkMode,
  onDateClick,
  onTimeSlotClick,
}) => {
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDropping, setIsDropping] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'calendar-event',
    drop: async (item: { event: CalendarEvent }) => {
      const draggedEvent = item.event;
      const targetDate = date;

      // Calculate how many hours to move the event to this date
      const originalStart = new Date(draggedEvent.start_datetime);
      const originalEnd = new Date(draggedEvent.end_datetime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      // Keep the same time but change the date
      const newStart = new Date(targetDate);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

      const newEnd = new Date(newStart.getTime() + duration);

      // Only update if the date actually changed
      if (newStart.toDateString() !== originalStart.toDateString()) {
        try {
          setIsDropping(true);
          await onEventUpdate(draggedEvent.id, {
            start_datetime: newStart.toISOString(),
            end_datetime: newEnd.toISOString(),
          });
          console.log('✅ Event moved to:', format(newStart, 'dd/MM/yyyy HH:mm'));
        } catch (error) {
          console.error('❌ Error moving event:', error);
        } finally {
          setIsDropping(false);
        }
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(dropRef);
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

  return (
    <div
      ref={dropRef}
      onClick={onDateClick}
      className={`
        relative min-h-[100px] h-full border cursor-pointer
        transition-all duration-200 group flex flex-col
        ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isOver && canDrop ? 'ring-2 ring-blue-300 bg-blue-50 dark:bg-blue-900/20' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-700
      `}
    >
      {/* Day number */}
      <div className="flex items-start justify-between mb-1 p-1 md:p-2">
        <span
          className={`
          text-sm font-medium
          ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
          ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
        `}
        >
          {format(date, 'd')}
        </span>

        {/* Quick add button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onTimeSlotClick();
          }}
          className={`
            opacity-0 group-hover:opacity-100 transition-opacity
            w-5 h-5 rounded-full flex items-center justify-center
            ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
          `}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Drop indicator */}
      {isDropping && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded">
          <div className="text-center py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1" />
            <p className="text-xs text-blue-600 dark:text-blue-400">Moviendo evento...</p>
          </div>
        </div>
      )}

      {/* Events container with smaller, more compact events */}
      <div className="flex-1 px-1 md:px-2 pb-1 md:pb-2 space-y-0.5 overflow-hidden">
        {/* Visible Events */}
        {visibleEvents.map(event => (
          <DraggableMonthEvent
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
            className={`w-full text-xs flex items-center justify-center py-0.5 rounded transition-colors ${
              isOver && canDrop
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MoreHorizontal className="h-3 w-3 mr-1" />+{hiddenEventsCount} más
          </button>
        )}

        {/* Drop zone hint for empty days */}
        {events.length === 0 && isOver && canDrop && (
          <div className="text-center py-2">
            <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Soltar aquí</p>
          </div>
        )}
      </div>

      {/* Today indicator */}
      {isToday && (
        <div className="absolute top-1 right-8">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
