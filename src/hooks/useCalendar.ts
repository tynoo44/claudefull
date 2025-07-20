import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { googleCalendarService } from '../lib/google-calendar';
import { useAuth } from '../contexts/AuthContext';
import type { CalendarEvent, GoogleCalendar, CreateEventRequest, UpdateEventRequest, CalendarView } from '../types/calendar';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export const useCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  // Get date range based on current view
  const getDateRange = useCallback(() => {
    switch (view) {
      case 'month':
        return {
          start: format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          end: format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        };
      case 'week':
        return {
          start: format(startOfWeek(currentDate), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          end: format(endOfWeek(currentDate), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        };
      case 'day':
        return {
          start: format(startOfDay(currentDate), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          end: format(endOfDay(currentDate), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        };
      default:
        return {
          start: format(startOfMonth(currentDate), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          end: format(endOfMonth(currentDate), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        };
    }
  }, [currentDate, view]);

  // Fetch user calendars
  const { data: calendars, isLoading: calendarsLoading } = useQuery({
    queryKey: ['calendars', user?.id],
    queryFn: () => googleCalendarService.getUserCalendars(user!.id),
    enabled: !!user?.id
  });

  // Fetch events
  const { start, end } = getDateRange();
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', user?.id, start, end],
    queryFn: () => googleCalendarService.getEvents(user!.id, start, end),
    enabled: !!user?.id
  });

  // Google auth mutations
  const connectGoogleMutation = useMutation({
    mutationFn: () => {
      const authUrl = googleCalendarService.getAuthUrl();
      window.location.href = authUrl;
      return Promise.resolve();
    }
  });

  const handleAuthCallbackMutation = useMutation({
    mutationFn: (code: string) => googleCalendarService.handleAuthCallback(code, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    }
  });

  // Sync mutations
  const syncCalendarsMutation = useMutation({
    mutationFn: (accountId: string) => googleCalendarService.syncCalendars(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    }
  });

  const syncEventsMutation = useMutation({
    mutationFn: ({ calendarId, timeMin, timeMax }: { calendarId: string; timeMin?: string; timeMax?: string }) =>
      googleCalendarService.syncEvents(calendarId, timeMin, timeMax),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Event CRUD mutations
  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventRequest) => googleCalendarService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: (eventData: UpdateEventRequest) => googleCalendarService.updateEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => googleCalendarService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Navigation helpers
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
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
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Filter events by selected calendars
  const filteredEvents = events?.filter(event => 
    selectedCalendars.length === 0 || selectedCalendars.includes(event.google_calendar_id)
  ) || [];

  // Get events for specific date
  const getEventsForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredEvents.filter(event => {
      const eventDate = format(new Date(event.start_datetime), 'yyyy-MM-dd');
      return eventDate === dateStr;
    });
  }, [filteredEvents]);

  // Get upcoming events (next 7 days)
  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.start_datetime) >= new Date())
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 10);

  return {
    // State
    currentDate,
    view,
    selectedCalendars,
    
    // Data
    calendars: calendars || [],
    events: filteredEvents,
    upcomingEvents,
    
    // Loading states
    calendarsLoading,
    eventsLoading,
    isConnecting: connectGoogleMutation.isPending,
    isSyncing: syncCalendarsMutation.isPending || syncEventsMutation.isPending,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    
    // Actions
    setView,
    setSelectedCalendars,
    navigateDate,
    goToToday,
    goToDate,
    getEventsForDate,
    
    // Google auth
    connectGoogle: connectGoogleMutation.mutate,
    handleAuthCallback: handleAuthCallbackMutation.mutate,
    
    // Sync
    syncCalendars: syncCalendarsMutation.mutate,
    syncEvents: syncEventsMutation.mutate,
    
    // Event CRUD
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    
    // Error states
    connectError: connectGoogleMutation.error,
    syncError: syncCalendarsMutation.error || syncEventsMutation.error,
    eventError: createEventMutation.error || updateEventMutation.error || deleteEventMutation.error
  };
};