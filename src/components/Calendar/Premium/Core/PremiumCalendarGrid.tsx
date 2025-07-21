import React, { useMemo, useState } from 'react';
import { usePremiumCalendar } from './PremiumCalendarProvider';
import { MonthViewGrid } from '../Views/MonthView/MonthViewGrid';
import { WeekViewGrid } from '../Views/WeekView/WeekViewGrid';
import { DayViewGrid } from '../Views/DayView/DayViewGrid';
import { AgendaViewList } from '../Views/AgendaView/AgendaViewList';
import type { CalendarEvent } from '../../../../types/calendar';

interface PremiumCalendarGridProps {
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onTimeSlotClick?: (date: Date, timeSlot?: { start: Date; end: Date }) => void;
}

export const PremiumCalendarGrid: React.FC<PremiumCalendarGridProps> = ({
  className = '',
  onEventClick,
  onDateClick,
  onTimeSlotClick,
}) => {
  const { uiState, multiCalendarState, events, calendars, selectEvent, updateEvent } =
    usePremiumCalendar();

  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Filter events based on selected calendars
  const visibleEvents = useMemo(() => {
    const eventsArray = Array.from(events.values());

    if (multiCalendarState.selectedCalendars.size === 0) {
      return eventsArray; // Show all events if no specific calendars selected
    }

    return eventsArray.filter(event =>
      multiCalendarState.selectedCalendars.has(event.google_calendar_id),
    );
  }, [events, multiCalendarState.selectedCalendars]);

  // Enhanced event click handler
  const handleEventClick = (event: CalendarEvent) => {
    selectEvent(event.id);
    onEventClick?.(event);
  };

  // Enhanced date click handler
  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  // Time slot click handler for week/day views
  const handleTimeSlotClick = (date: Date, timeSlot?: { start: Date; end: Date }) => {
    onTimeSlotClick?.(date, timeSlot);
  };

  // Event hover handlers for enhanced UX
  const handleEventHover = (eventId: string | null) => {
    setHoveredEvent(eventId);
  };

  // Common props for all view components
  const commonViewProps = {
    currentDate: uiState.currentDate,
    events: visibleEvents,
    selectedEvents: uiState.selectedEvents,
    hoveredEvent,
    calendars: Array.from(calendars.values()),
    multiCalendarSettings: multiCalendarState,
    onEventClick: handleEventClick,
    onDateClick: handleDateClick,
    onTimeSlotClick: handleTimeSlotClick,
    onEventHover: handleEventHover,
    onEventUpdate: updateEvent,
    isLoading: uiState.isLoading,
  };

  // Render appropriate view based on current view
  const renderCalendarView = () => {
    switch (uiState.currentView) {
      case 'month':
        return <MonthViewGrid {...commonViewProps} />;

      case 'week':
      case '3-day':
        return (
          <WeekViewGrid {...commonViewProps} daysToShow={uiState.currentView === '3-day' ? 3 : 7} />
        );

      case 'day':
        return <DayViewGrid {...commonViewProps} />;

      case 'agenda':
        return <AgendaViewList {...commonViewProps} />;

      case 'year':
        // TODO: Implement year view
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Vista Anual</h3>
              <p>Próximamente disponible</p>
            </div>
          </div>
        );

      default:
        return <MonthViewGrid {...commonViewProps} />;
    }
  };

  return (
    <div className={`premium-calendar-grid h-full ${className}`}>
      {/* Loading Overlay */}
      {uiState.isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Cargando calendario...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uiState.error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{uiState.error}</p>
        </div>
      )}

      {/* Calendar View Container */}
      <div className="calendar-view-container h-full relative">{renderCalendarView()}</div>

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
          <div>Vista: {uiState.currentView}</div>
          <div>Fecha: {uiState.currentDate.toLocaleDateString()}</div>
          <div>Eventos: {visibleEvents.length}</div>
          <div>Calendarios: {multiCalendarState.selectedCalendars.size}</div>
          <div>Seleccionados: {uiState.selectedEvents.size}</div>
          {hoveredEvent && <div>Hover: {hoveredEvent.substring(0, 8)}...</div>}
        </div>
      )}
    </div>
  );
};
