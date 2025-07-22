import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  isSameWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendarCache } from '../contexts/CalendarCacheContext';
import { GoogleCalendarService } from '../lib/google-calendar';

// Layout components
import { CalendarToolbar } from '../components/Calendar/Premium/Layout/CalendarToolbar';
import { CalendarNavigation, ViewType } from '../components/Calendar/Premium/Layout/CalendarNavigation';
import { CalendarSidebar } from '../components/Calendar/Premium/Layout/CalendarSidebar';
import { CalendarStatusBar } from '../components/Calendar/Premium/Layout/CalendarStatusBar';

// View components
import { MonthView } from '../components/Calendar/Premium/MonthView';
import { WeekView } from '../components/Calendar/Premium/WeekView';
import { DayView } from '../components/Calendar/Premium/DayView';
import { AgendaView } from '../components/Calendar/Premium/AgendaView';

// Modal components
import { EventDetailModal } from '../components/Calendar/Premium/EventDetailModal';
import { EventCreateModal } from '../components/Calendar/Premium/EventCreateModal';

// Placeholder view component
import { PlaceholderView } from '../components/Calendar/Premium/PlaceholderView';

// Types
type TimeFormat = '12h' | '24h';

interface LocalCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  calendarId: string;
  calendarName: string;
  description?: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    avatar?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
  }>;
  type: 'meeting' | 'event' | 'reminder' | 'task';
  isRecurring?: boolean;
  isAllDay?: boolean;
  meetingLink?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface CalendarSettings {
  timeFormat: TimeFormat;
  weekStartsOn: 0 | 1;
  showWeekends: boolean;
  showDeclinedEvents: boolean;
  showAllDayEvents: boolean;
  defaultEventDuration: number;
  notifications: boolean;
  compactView: boolean;
}

interface PremiumCalendarAdvancedProps {
  darkMode: boolean;
}

export const PremiumCalendarAdvanced: React.FC<PremiumCalendarAdvancedProps> = ({ darkMode }) => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LocalCalendarEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState<{ date?: Date; hour?: number }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use global calendar cache
  const { events, calendars, isLoading, forceRefresh, loadMonth } = useCalendarCache();

  // Load current month when component mounts
  React.useEffect(() => {
    console.log('🚀 PremiumCalendarAdvanced mounted - loading current month...');
    loadMonth(new Date());
  }, [loadMonth]);

  const [settings] = useState<CalendarSettings>({
    timeFormat: '24h',
    weekStartsOn: 1,
    showWeekends: true,
    showDeclinedEvents: false,
    showAllDayEvents: true,
    defaultEventDuration: 60,
    notifications: true,
    compactView: false,
  });

  // Navigation functions
  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      let newDate: Date;

      switch (currentView) {
        case 'month':
          newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
          setCurrentDate(newDate);
          loadMonth(newDate);
          break;
        case 'week':
          newDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
          setCurrentDate(newDate);
          loadMonth(newDate);
          break;
        case 'day':
          newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
          setCurrentDate(newDate);
          loadMonth(newDate);
          break;
        case 'year':
          newDate = direction === 'next' ? addMonths(currentDate, 12) : subMonths(currentDate, 12);
          setCurrentDate(newDate);
          break;
      }
    },
    [currentView, currentDate, loadMonth],
  );

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    loadMonth(today);
  }, [loadMonth]);

  // Convert and filter events
  const filteredEvents = useMemo((): LocalCalendarEvent[] => {
    console.log('=== FILTERING EVENTS ===');
    console.log('Total events available:', events.length);
    console.log('Calendars state:', calendars);

    if (events.length === 0) {
      console.log('No events to filter');
      return [];
    }

    // Convert to local format
    const localEvents: LocalCalendarEvent[] = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      color: event.color,
      calendarId: event.calendarId,
      calendarName: event.calendarName,
      description: event.description,
      location: event.location,
      attendees: event.attendees,
      isRecurring: event.isRecurring,
      isAllDay: event.isAllDay,
      meetingLink: event.meetingLink,
      type: 'event',
      priority: 'medium',
    }));

    const filtered = localEvents.filter(event => {
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      console.log(`Event: ${event.title}`);
      console.log(`  - Event calendarId: ${event.calendarId}`);
      console.log(`  - Calendar found: ${!!calendar}`);
      console.log(`  - Calendar visible: ${calendar?.visible}`);

      if (!calendar || !calendar.visible) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query);
        return matches;
      }

      return true;
    });

    console.log('Filtered events count:', filtered.length);
    return filtered;
  }, [events, calendars, searchQuery]);

  // Get date range label
  const getDateRangeLabel = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: es });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartsOn });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: settings.weekStartsOn });
        return `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy', { locale: es })}`;
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: es });
      case 'year':
        return format(currentDate, 'yyyy');
      case 'agenda':
        return 'Próximos eventos';
      default:
        return '';
    }
  };

  // Event handlers
  const handleEventCreated = async () => {
    setShowCreateModal(false);
    setCreateModalData({});
    await forceRefresh();
  };

  const handleEventUpdated = async () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    await forceRefresh();
  };

  const handleEventDeleted = async () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    await forceRefresh();
  };

  const handleEditEvent = (event: LocalCalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(false);
    setCreateModalData({ date: event.start });
    setShowCreateModal(true);
  };

  const handleEventUpdate = useCallback(
    async (eventId: string, updates: any): Promise<any> => {
      try {
        const calendarService = new GoogleCalendarService();
        const eventToUpdate = events.find(e => e.id === eventId);

        if (!eventToUpdate) {
          throw new Error('Event not found');
        }

        const updateData = {
          id: eventId,
          title: updates.title || eventToUpdate.title,
          description: updates.description || eventToUpdate.description,
          location: updates.location || eventToUpdate.location,
          start_datetime:
            updates.start_datetime ||
            (updates.start ? updates.start.toISOString() : eventToUpdate.start.toISOString()),
          end_datetime:
            updates.end_datetime ||
            (updates.end ? updates.end.toISOString() : eventToUpdate.end.toISOString()),
          is_all_day:
            updates.isAllDay !== undefined ? updates.isAllDay : eventToUpdate.isAllDay || false,
        };

        const updatedEvent = await calendarService.updateEvent(
          eventToUpdate.calendarId,
          eventId,
          updateData,
        );

        await forceRefresh();

        // Return updated event in local format
        const updatedLocalEvent: LocalCalendarEvent = {
          id: eventToUpdate.id,
          title: updatedEvent.title,
          start: new Date(updatedEvent.start_datetime),
          end: new Date(updatedEvent.end_datetime),
          color: eventToUpdate.color,
          calendarId: eventToUpdate.calendarId,
          calendarName: eventToUpdate.calendarName,
          description: updatedEvent.description,
          location: updatedEvent.location,
          isAllDay: updatedEvent.is_all_day,
          attendees: eventToUpdate.attendees,
          type: 'event',
          priority: 'medium',
        };

        return updatedLocalEvent;
      } catch (error) {
        console.error('Error updating event:', error);
        throw error;
      }
    },
    [events, forceRefresh],
  );

  const handleCalendarToggle = (calendar: any) => {
    // Save visibility preferences to localStorage
    const updatedCalendars = calendars.map(cal =>
      cal.id === calendar.id ? { ...cal, visible: !cal.visible } : cal,
    );

    const visibilityMap = updatedCalendars.reduce(
      (acc, cal) => {
        acc[cal.id] = cal.visible;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    localStorage.setItem('calendar-visibility', JSON.stringify(visibilityMap));

    // Force refresh to apply visibility changes
    forceRefresh();
  };

  // Render current view
  const renderCurrentView = () => {
    const commonProps = {
      currentDate,
      events: filteredEvents,
      calendars,
      darkMode,
    };

    switch (currentView) {
      case 'month':
        return (
          <MonthView
            {...commonProps}
            selectedDate={selectedDate}
            selectedEvent={selectedEvent}
            hoveredEvent={hoveredEvent}
            onDateClick={setSelectedDate}
            onEventClick={event => {
              setSelectedEvent(event);
              setShowEventModal(true);
            }}
            onEventHover={setHoveredEvent}
            onTimeSlotClick={date => {
              setSelectedDate(date);
              setCreateModalData({ date });
              setShowCreateModal(true);
            }}
            onEventUpdate={handleEventUpdate}
            compactView={settings.compactView}
          />
        );
      case 'week':
        return (
          <WeekView
            {...commonProps}
            selectedDate={selectedDate}
            selectedEvent={selectedEvent}
            hoveredEvent={hoveredEvent}
            onDateClick={setSelectedDate}
            onEventClick={event => {
              setSelectedEvent(event);
              setShowEventModal(true);
            }}
            onEventHover={setHoveredEvent}
            onTimeSlotClick={(date, hour) => {
              setSelectedDate(date);
              setCreateModalData({ date, hour });
              setShowCreateModal(true);
            }}
            compactView={settings.compactView}
          />
        );
      case 'day':
        return (
          <DayView
            {...commonProps}
            selectedEvent={selectedEvent}
            hoveredEvent={hoveredEvent}
            onEventClick={event => {
              setSelectedEvent(event);
              setShowEventModal(true);
            }}
            onEventHover={setHoveredEvent}
            onTimeSlotClick={(date, hour) => {
              setSelectedDate(date);
              setCreateModalData({ date, hour });
              setShowCreateModal(true);
            }}
            compactView={settings.compactView}
          />
        );
      case 'agenda':
        return (
          <AgendaView
            {...commonProps}
            selectedEvent={selectedEvent}
            hoveredEvent={hoveredEvent}
            onEventClick={event => {
              setSelectedEvent(event);
              setShowEventModal(true);
            }}
            onEventHover={setHoveredEvent}
            onTimeSlotClick={(date, hour) => {
              setSelectedDate(date);
              setCreateModalData({ date, hour });
              setShowCreateModal(true);
            }}
          />
        );
      default:
        return <PlaceholderView currentView={currentView} darkMode={darkMode} isLoading={isLoading} />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <CalendarToolbar
          darkMode={darkMode}
          searchQuery={searchQuery}
          isLoading={isLoading}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onSearchChange={setSearchQuery}
          onRefresh={forceRefresh}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onCreateEvent={() => {
            setCreateModalData({ date: selectedDate || new Date() });
            setShowCreateModal(true);
          }}
        />

        <CalendarNavigation
          darkMode={darkMode}
          currentView={currentView}
          dateRangeLabel={getDateRangeLabel()}
          onGoToToday={goToToday}
          onNavigateDate={navigateDate}
          onViewChange={setCurrentView}
        />

        <div className="flex flex-1 overflow-hidden">
          {showSidebar && (
            <CalendarSidebar
              darkMode={darkMode}
              currentDate={currentDate}
              selectedDate={selectedDate}
              calendars={calendars}
              todayEventsCount={filteredEvents.filter(event => isToday(event.start)).length}
              weekEventsCount={filteredEvents.filter(event => isSameWeek(event.start, new Date())).length}
              onDateSelect={setSelectedDate}
              onMonthChange={(date) => {
                setCurrentDate(date);
                loadMonth(date);
              }}
              onCalendarToggle={handleCalendarToggle}
            />
          )}

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} p-4`}>
              <div className="h-full overflow-hidden">
                {renderCurrentView()}
              </div>
            </div>

            <CalendarStatusBar
              darkMode={darkMode}
              eventsCount={filteredEvents.length}
              searchQuery={searchQuery}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && showEventModal && (
          <EventDetailModal
            event={selectedEvent}
            calendars={calendars}
            onClose={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
            onEdit={handleEditEvent}
            onDelete={handleEventDeleted}
            onDuplicate={event => {
              console.log('Duplicate event:', event);
              // TODO: Implement duplicate functionality
            }}
            darkMode={darkMode}
          />
        )}

        {/* Event Create/Edit Modal */}
        <EventCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateModalData({});
            setSelectedEvent(null);
          }}
          calendars={calendars}
          selectedDate={createModalData.date}
          selectedHour={createModalData.hour}
          existingEvent={selectedEvent}
          darkMode={darkMode}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
        />
      </div>
    </DndProvider>
  );
};