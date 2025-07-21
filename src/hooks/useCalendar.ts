import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { googleCalendarService } from '../lib/google-calendar';
import { useAuth } from '../contexts/AuthContext';
import type { CreateEventRequest, UpdateEventRequest, CalendarView } from '../types/calendar';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';

export const useCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');

  // Check if user has Google Calendar access
  const { data: hasAccess } = useQuery({
    queryKey: ['hasGoogleAccess', user?.id],
    queryFn: () => googleCalendarService.hasGoogleAccess(),
    enabled: !!user?.id,
  });

  // Get date range based on current view
  const getDateRange = useCallback(() => {
    switch (view) {
      case 'month':
        return {
          start: format(startOfWeek(startOfMonth(currentDate)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          end: format(endOfWeek(endOfMonth(currentDate)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };
      case 'week':
        return {
          start: format(startOfWeek(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          end: format(endOfWeek(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };
      case 'day':
        return {
          start: format(startOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          end: format(endOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };
      default:
        return {
          start: format(startOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
          end: format(endOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        };
    }
  }, [currentDate, view]);

  // Fetch user calendars
  const {
    data: calendars = [],
    isLoading: calendarsLoading,
    refetch: refetchCalendars,
  } = useQuery({
    queryKey: ['calendars', user?.id],
    queryFn: () => googleCalendarService.getUserCalendars(),
    enabled: !!user?.id && !!hasAccess,
  });

  // Fetch events
  const { start, end } = getDateRange();
  const {
    data: events = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['events', user?.id, selectedCalendarId, start, end],
    queryFn: () => googleCalendarService.getEvents(selectedCalendarId, start, end),
    enabled: !!user?.id && !!hasAccess && !!selectedCalendarId,
  });

  // Event CRUD mutations
  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventRequest) => googleCalendarService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: (eventData: UpdateEventRequest) => googleCalendarService.updateEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: ({ eventId, calendarId }: { eventId: string; calendarId: string }) =>
      googleCalendarService.deleteEvent(eventId, calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // Navigation helpers
  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        switch (view) {
          case 'month':
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            break;
          case 'week':
            newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
            break;
          case 'day':
            newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
            break;
        }
        return newDate;
      });
    },
    [view],
  );

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Get events for specific date
  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return events.filter(event => {
        const eventDate = format(new Date(event.start_datetime), 'yyyy-MM-dd');
        return eventDate === dateStr;
      });
    },
    [events],
  );

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter(event => new Date(event.start_datetime) >= new Date())
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 10);

  // Sync functions
  const syncCalendars = useCallback(async () => {
    await refetchCalendars();
  }, [refetchCalendars]);

  const syncEvents = useCallback(async () => {
    await refetchEvents();
  }, [refetchEvents]);

  return {
    // State
    currentDate,
    view,
    selectedCalendarId,
    hasGoogleAccess: hasAccess || false,

    // Data
    calendars,
    events,
    upcomingEvents,

    // Loading states
    calendarsLoading,
    eventsLoading,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,

    // Actions
    setView,
    setSelectedCalendarId,
    navigateDate,
    goToToday,
    goToDate,
    getEventsForDate,

    // Sync
    syncCalendars,
    syncEvents,

    // Event CRUD
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,

    // Error states
    eventError: createEventMutation.error || updateEventMutation.error || deleteEventMutation.error,
  };
};
