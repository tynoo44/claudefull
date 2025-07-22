import React, { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addHours,
  differenceInMinutes,
  startOfDay,
} from 'date-fns';
import type { CalendarEvent as DatabaseCalendarEvent } from '../../../types/calendar';
import { MonthViewDay } from './Views/MonthView/MonthViewDay';

// Local CalendarEvent interface to match PremiumCalendarAdvanced
interface CalendarEvent {
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

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Array<{ id: string; name: string; color: string; visible: boolean }>;
  selectedDate: Date | null;
  selectedEvent: CalendarEvent | null;
  hoveredEvent: string | null;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventHover: (eventId: string | null) => void;
  onTimeSlotClick: (date: Date, hour?: number) => void;
  onEventUpdate?: (
    eventId: string,
    updates: Partial<DatabaseCalendarEvent>,
  ) => Promise<CalendarEvent>;
  darkMode: boolean;
  compactView?: boolean;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  calendars,
  selectedDate,
  selectedEvent,
  hoveredEvent,
  onDateClick,
  onEventClick,
  onEventHover,
  onTimeSlotClick,
  onEventUpdate = async () => ({}) as CalendarEvent,
  darkMode,
  compactView = false,
}) => {
  // Calculate month days including padding
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start, { weekStartsOn: 0 });
    const endWeek = endOfWeek(end, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startWeek, end: endWeek });
  }, [currentDate]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    events.forEach(event => {
      // Only show events from visible calendars
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      if (!calendar?.visible) return;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Handle multi-day events
      let currentDay = startOfDay(eventStart);
      const endDay = startOfDay(eventEnd);

      while (currentDay <= endDay) {
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const dayEvents = grouped.get(dateKey) || [];
        dayEvents.push(event);
        grouped.set(dateKey, dayEvents);
        currentDay = addHours(currentDay, 24);
      }
    });

    // Sort events by start time within each day
    grouped.forEach((dayEvents, key) => {
      dayEvents.sort((a, b) => {
        const startA = new Date(a.start).getTime();
        const startB = new Date(b.start).getTime();
        if (startA !== startB) return startA - startB;

        // If same start time, sort by duration (longer first)
        const durationA = differenceInMinutes(new Date(a.end), new Date(a.start));
        const durationB = differenceInMinutes(new Date(b.end), new Date(b.start));
        return durationB - durationA;
      });
      grouped.set(key, dayEvents);
    });

    return grouped;
  }, [events, calendars]);

  // Calendar color mapping for MonthViewDay

  // Create calendar colors map for MonthViewDay
  const calendarColors = useMemo(() => {
    const colorsMap = new Map<string, string>();
    calendars.forEach(calendar => {
      colorsMap.set(calendar.id, calendar.color);
    });
    return colorsMap;
  }, [calendars]);

  // Using DraggableMonthEvent component via MonthViewDay instead of renderEventPreview

  // Using MonthViewDay component instead of renderDayCell

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Week headers */}
      <div
        className={`shrink-0 grid grid-cols-7 gap-px mb-2 ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}
      >
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div
            key={day}
            className={`
              text-center py-2 text-sm font-semibold
              ${darkMode ? 'text-gray-300' : 'text-gray-700'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 h-full min-h-[600px]">
          {monthDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);

            // Convert events to match the expected DatabaseCalendarEvent interface
            const convertedEvents: DatabaseCalendarEvent[] = dayEvents.map(event => ({
              id: event.id,
              user_id: '', // Will be filled by the backend
              google_calendar_id: event.calendarId,
              google_event_id: event.id,
              title: event.title,
              description: event.description,
              location: event.location,
              start_datetime:
                typeof event.start === 'string' ? event.start : event.start.toISOString(),
              end_datetime: typeof event.end === 'string' ? event.end : event.end.toISOString(),
              is_all_day: event.isAllDay || false,
              status: 'confirmed' as const,
              visibility: 'default' as const,
              attendees:
                event.attendees?.map(att => ({
                  email: att.email,
                  display_name: att.name || att.email,
                  response_status: (att.status === 'pending' ? 'needsAction' : att.status) as
                    | 'needsAction'
                    | 'declined'
                    | 'tentative'
                    | 'accepted',
                })) || [],
              recurrence: undefined,
              reminders: [],
              color_id: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
              sync_status: 'synced' as const,
            }));

            return (
              <MonthViewDay
                key={dateKey}
                date={day}
                events={convertedEvents}
                selectedEvents={selectedEvent ? new Set([selectedEvent.id]) : new Set()}
                hoveredEvent={hoveredEvent}
                calendarColors={calendarColors}
                multiCalendarSettings={{
                  selectedCalendars: new Set(calendars.filter(c => c.visible).map(c => c.id)),
                  calendarSettings: new Map(),
                  calendarGroups: [],
                  overlaySettings: {
                    mode: 'separate',
                    colorScheme: 'auto',
                    showConflicts: true,
                    conflictResolution: 'highlight',
                  },
                  activeFilters: {
                    dateRange: { start: new Date(), end: new Date() },
                    calendarIds: [],
                    eventTypes: [],
                    searchQuery: '',
                  },
                }}
                onEventClick={dbEvent => {
                  // Convert DatabaseCalendarEvent back to CalendarEvent for the click handler
                  const calendarEvent: CalendarEvent = {
                    id: dbEvent.id,
                    title: dbEvent.title,
                    start: new Date(dbEvent.start_datetime),
                    end: new Date(dbEvent.end_datetime),
                    color: calendarColors.get(dbEvent.google_calendar_id) || '#3b82f6',
                    calendarId: dbEvent.google_calendar_id,
                    calendarName:
                      calendars.find(cal => cal.id === dbEvent.google_calendar_id)?.name || '',
                    description: dbEvent.description,
                    location: dbEvent.location,
                    attendees:
                      dbEvent.attendees?.map(att => ({
                        email: att.email,
                        name: att.display_name,
                        status: (att.response_status === 'needsAction'
                          ? 'pending'
                          : att.response_status) as
                          | 'accepted'
                          | 'declined'
                          | 'tentative'
                          | 'pending',
                      })) || [],
                    type: 'meeting',
                    isAllDay: dbEvent.is_all_day,
                    priority: 'medium',
                  };
                  onEventClick(calendarEvent);
                }}
                onEventHover={onEventHover}
                onEventUpdate={async (eventId, updates) => {
                  // Call the original handler and convert the result
                  const localResult = await onEventUpdate(eventId, updates);
                  // Return DatabaseCalendarEvent format
                  return {
                    id: localResult.id,
                    user_id: '', // Will be filled by backend
                    google_calendar_id: localResult.calendarId,
                    google_event_id: localResult.id,
                    title: localResult.title,
                    description: localResult.description,
                    location: localResult.location,
                    start_datetime:
                      typeof localResult.start === 'string'
                        ? localResult.start
                        : localResult.start.toISOString(),
                    end_datetime:
                      typeof localResult.end === 'string'
                        ? localResult.end
                        : localResult.end.toISOString(),
                    is_all_day: localResult.isAllDay || false,
                    status: 'confirmed' as const,
                    visibility: 'default' as const,
                    attendees:
                      localResult.attendees?.map(att => ({
                        email: att.email,
                        display_name: att.name || att.email,
                        response_status: (att.status === 'pending' ? 'needsAction' : att.status) as
                          | 'needsAction'
                          | 'declined'
                          | 'tentative'
                          | 'accepted',
                      })) || [],
                    recurrence: undefined,
                    reminders: [],
                    color_id: undefined,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_synced_at: new Date().toISOString(),
                    sync_status: 'synced' as const,
                  };
                }}
                maxVisibleEvents={compactView ? 2 : 3}
                // Additional props for day cell behavior
                isCurrentMonth={isCurrentMonth}
                isSelected={!!isSelected}
                isToday={today}
                darkMode={darkMode}
                onDateClick={() => onDateClick(day)}
                onTimeSlotClick={() => onTimeSlotClick(day)}
              />
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div
        className={`shrink-0 mt-2 p-2 text-xs flex items-center justify-between ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
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
            eventos visibles
          </span>
          <span>Semana {format(currentDate, 'w')}</span>
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
