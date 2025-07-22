import { useCallback } from 'react';
import type { CalendarEvent } from '../../../../../types/calendar';
import { GoogleCalendarService } from '../../../../../lib/google-calendar';
import { calendarCache } from '../../../../../lib/calendar-cache';
import type { PremiumCalendarAction } from '../reducer/types';

interface UseEventOperationsProps {
  events: Map<string, CalendarEvent>;
  dispatch: React.Dispatch<PremiumCalendarAction>;
  googleCalendarService: React.MutableRefObject<GoogleCalendarService>;
}

export const useEventOperations = ({
  events,
  dispatch,
  googleCalendarService,
}: UseEventOperationsProps) => {
  const createEvent = useCallback(
    async (eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      try {
        // Create event via Google Calendar service
        const newEvent = await googleCalendarService.current.createEvent(
          eventData.google_calendar_id || 'primary',
          {
            title: eventData.title || 'Nuevo Evento',
            description: eventData.description,
            location: eventData.location,
            start_datetime: eventData.start_datetime || new Date().toISOString(),
            end_datetime: eventData.end_datetime || new Date(Date.now() + 3600000).toISOString(),
            is_all_day: eventData.is_all_day || false,
            attendees: eventData.attendees,
            reminders: eventData.reminders,
          },
        );

        // Cache the new event
        calendarCache.cacheEvent(newEvent);

        // Update local state
        dispatch({ type: 'ADD_EVENT', payload: newEvent });

        console.log('✅ Event created successfully:', newEvent.title);
        return newEvent;
      } catch (error) {
        console.error('Failed to create event:', error);
        throw error;
      }
    },
    [dispatch, googleCalendarService],
  );

  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      try {
        const existingEvent = events.get(eventId);
        if (!existingEvent) {
          throw new Error(`Event ${eventId} not found`);
        }

        // Update via Google Calendar API
        const updatedEvent = await googleCalendarService.current.updateEvent(
          existingEvent.google_calendar_id,
          eventId,
          {
            id: eventId,
            title: updates.title,
            description: updates.description,
            location: updates.location,
            start_datetime: updates.start_datetime,
            end_datetime: updates.end_datetime,
            is_all_day: updates.is_all_day,
            attendees: updates.attendees,
            reminders: updates.reminders,
          },
        );

        // Update cache
        calendarCache.cacheEvent(updatedEvent);

        // Update local state
        dispatch({ type: 'UPDATE_EVENT', payload: { eventId, updates: updatedEvent } });

        console.log('✅ Event updated successfully:', updatedEvent.title);
        return updatedEvent;
      } catch (error) {
        console.error('Failed to update event:', error);
        throw error;
      }
    },
    [events, dispatch, googleCalendarService],
  );

  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        const existingEvent = events.get(eventId);
        if (!existingEvent) {
          throw new Error(`Event ${eventId} not found`);
        }

        // Delete via Google Calendar API
        await googleCalendarService.current.deleteEvent(existingEvent.google_calendar_id, eventId);

        // Update local state
        dispatch({ type: 'DELETE_EVENT', payload: eventId });

        console.log('✅ Event deleted successfully:', eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
        throw error;
      }
    },
    [events, dispatch, googleCalendarService],
  );

  const duplicateEvent = useCallback(
    async (eventId: string): Promise<CalendarEvent> => {
      const originalEvent = events.get(eventId);
      if (!originalEvent) {
        throw new Error('Event not found');
      }

      const duplicatedEvent = {
        ...originalEvent,
        id: `dup-${Date.now()}`,
        title: `${originalEvent.title} (Copia)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_EVENT', payload: duplicatedEvent });
      return duplicatedEvent;
    },
    [events, dispatch],
  );

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
  };
};