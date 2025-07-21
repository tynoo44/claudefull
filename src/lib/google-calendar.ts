import { supabase } from './supabase';
import type { CalendarEvent, GoogleCalendar, CreateEventRequest, UpdateEventRequest } from '../types/calendar';

export class GoogleCalendarService {
  // Check if user has Google provider in their session
  async hasGoogleAccess(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      console.log('❌ No provider_token found. Need to re-authenticate with Calendar scopes.');
      return false;
    }
    console.log('✅ Provider token found:', session.provider_token.substring(0, 20) + '...');
    return true;
  }

  // Get list of user's Google calendars
  async getUserCalendars(): Promise<GoogleCalendar[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Get provider token from session
      const providerToken = session.provider_token;
      if (!providerToken) {
        throw new Error('No Google provider token found. Please re-authenticate.');
      }

      console.log('🔑 Sending provider token to Edge Function');
      
      // Call new edge function with provider token in body
      const { data, error } = await supabase.functions.invoke('get-google-calendar-list-v2', {
        body: { 
          providerToken: providerToken
        }
      });
      
      if (error) throw error;

      // Transform Google Calendar data to our format
      const calendars: GoogleCalendar[] = data?.map((cal: any) => ({
        id: cal.id,
        calendar_account_id: session.user.id,
        google_calendar_id: cal.id,
        name: cal.summary || 'Sin nombre',
        description: cal.description,
        time_zone: cal.timeZone,
        color_id: cal.colorId,
        is_primary: cal.primary || false,
        access_role: cal.accessRole,
        is_visible: !cal.hidden,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) || [];

      return calendars;
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  // Get events from Google Calendar
  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Get provider token from session
      const providerToken = session.provider_token;
      if (!providerToken) {
        throw new Error('No Google provider token found. Please re-authenticate.');
      }

      console.log('🔑 Sending provider token to get events Edge Function');

      // Call edge function to get events with provider token
      const { data, error } = await supabase.functions.invoke('get-google-calendar-events-v2', {
        body: { 
          providerToken: providerToken,
          calendarId,
          timeMin,
          timeMax
        }
      });

      if (error) throw error;

      // Transform Google events to our format
      const events: CalendarEvent[] = data?.map((event: any) => ({
        id: event.id,
        user_id: session.user.id,
        google_calendar_id: calendarId,
        google_event_id: event.id,
        title: event.summary || 'Sin título',
        description: event.description,
        location: event.location,
        start_datetime: event.start?.dateTime || event.start?.date,
        end_datetime: event.end?.dateTime || event.end?.date,
        is_all_day: !event.start?.dateTime,
        status: event.status || 'confirmed',
        visibility: event.visibility || 'default',
        attendees: event.attendees?.map((att: any) => ({
          email: att.email,
          display_name: att.displayName,
          response_status: att.responseStatus || 'needsAction',
          is_organizer: att.organizer || false,
          is_resource: att.resource || false
        })) || [],
        reminders: event.reminders?.overrides?.map((rem: any) => ({
          method: rem.method,
          minutes: rem.minutes
        })) || [],
        recurrence: event.recurrence ? this.parseRecurrence(event.recurrence) : undefined,
        color_id: event.colorId,
        created_at: event.created || new Date().toISOString(),
        updated_at: event.updated || new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced'
      })) || [];

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  // Create new event in Google Calendar
  async createEvent(eventData: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Get provider token from session
      const providerToken = session.provider_token;
      if (!providerToken) {
        throw new Error('No Google provider token found. Please re-authenticate.');
      }

      console.log('🔑 Sending provider token to create event Edge Function');

      // Prepare Google Calendar event format
      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.is_all_day 
          ? { date: eventData.start_datetime.split('T')[0] }
          : { dateTime: eventData.start_datetime, timeZone: 'America/Mexico_City' },
        end: eventData.is_all_day
          ? { date: eventData.end_datetime.split('T')[0] }
          : { dateTime: eventData.end_datetime, timeZone: 'America/Mexico_City' },
        attendees: eventData.attendees?.map(att => ({
          email: att.email,
          displayName: att.display_name
        })),
        reminders: eventData.reminders ? {
          useDefault: false,
          overrides: eventData.reminders
        } : undefined
      };

      // Call edge function to create event
      const { data, error } = await supabase.functions.invoke('create-google-calendar-event-v2', {
        body: { 
          providerToken: providerToken,
          calendarId: eventData.google_calendar_id || 'primary',
          event: googleEvent
        }
      });

      if (error) throw error;

      // Transform response to our format
      const createdEvent: CalendarEvent = {
        id: data.id,
        user_id: session.user.id,
        google_calendar_id: eventData.google_calendar_id,
        google_event_id: data.id,
        title: data.summary || eventData.title,
        description: data.description || eventData.description,
        location: data.location || eventData.location,
        start_datetime: data.start?.dateTime || data.start?.date || eventData.start_datetime,
        end_datetime: data.end?.dateTime || data.end?.date || eventData.end_datetime,
        is_all_day: eventData.is_all_day || false,
        status: data.status || 'confirmed',
        visibility: data.visibility || 'default',
        attendees: eventData.attendees || [],
        reminders: eventData.reminders || [],
        recurrence: eventData.recurrence,
        color_id: data.colorId,
        created_at: data.created || new Date().toISOString(),
        updated_at: data.updated || new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced'
      };

      return createdEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Update event in Google Calendar
  async updateEvent(eventData: UpdateEventRequest): Promise<CalendarEvent> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Get provider token from session
      const providerToken = session.provider_token;
      if (!providerToken) {
        throw new Error('No Google provider token found. Please re-authenticate.');
      }

      console.log('🔑 Sending provider token to update event Edge Function');

      // Get the existing event to get the google_event_id
      const { data: existingEvent } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventData.id)
        .single();

      if (!existingEvent || !existingEvent.google_event_id) {
        throw new Error('Event not found or not synced with Google');
      }

      // Prepare Google Calendar event format
      const googleEvent: any = {};
      
      if (eventData.title) googleEvent.summary = eventData.title;
      if (eventData.description !== undefined) googleEvent.description = eventData.description;
      if (eventData.location !== undefined) googleEvent.location = eventData.location;
      
      if (eventData.start_datetime) {
        googleEvent.start = eventData.is_all_day 
          ? { date: eventData.start_datetime.split('T')[0] }
          : { dateTime: eventData.start_datetime, timeZone: 'America/Mexico_City' };
      }
      
      if (eventData.end_datetime) {
        googleEvent.end = eventData.is_all_day
          ? { date: eventData.end_datetime.split('T')[0] }
          : { dateTime: eventData.end_datetime, timeZone: 'America/Mexico_City' };
      }

      if (eventData.attendees) {
        googleEvent.attendees = eventData.attendees.map(att => ({
          email: att.email,
          displayName: att.display_name
        }));
      }

      if (eventData.reminders) {
        googleEvent.reminders = {
          useDefault: false,
          overrides: eventData.reminders
        };
      }

      // Call edge function to update event
      const { data, error } = await supabase.functions.invoke('update-google-calendar-event-v2', {
        body: { 
          providerToken: providerToken,
          calendarId: existingEvent.google_calendar_id || 'primary',
          eventId: existingEvent.google_event_id,
          event: googleEvent
        }
      });

      if (error) throw error;

      // Update local database
      const { data: updatedEvent, error: updateError } = await supabase
        .from('calendar_events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        })
        .eq('id', eventData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete event from Google Calendar
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Get provider token from session
      const providerToken = session.provider_token;
      if (!providerToken) {
        throw new Error('No Google provider token found. Please re-authenticate.');
      }

      console.log('🔑 Sending provider token to delete event Edge Function');

      // Get the event to get the google_event_id
      const { data: existingEvent } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!existingEvent) {
        throw new Error('Event not found');
      }

      // If it's a Google Calendar event, delete it from Google
      if (existingEvent.google_event_id) {
        const { error } = await supabase.functions.invoke('delete-google-calendar-event-v2', {
          body: { 
            providerToken: providerToken,
            calendarId: existingEvent.google_calendar_id || calendarId,
            eventId: existingEvent.google_event_id
          }
        });

        if (error) throw error;
      }

      // Delete from local database
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Helper to parse recurrence rules
  private parseRecurrence(recurrenceRules: string[]): any {
    // Simple parser for RRULE
    // In a real implementation, you'd want a more robust parser
    const rule = recurrenceRules[0];
    if (!rule || !rule.startsWith('RRULE:')) return undefined;

    const parts = rule.substring(6).split(';');
    const recurrence: any = {};

    parts.forEach(part => {
      const [key, value] = part.split('=');
      switch (key) {
        case 'FREQ':
          recurrence.frequency = value;
          break;
        case 'INTERVAL':
          recurrence.interval = parseInt(value);
          break;
        case 'COUNT':
          recurrence.count = parseInt(value);
          break;
        case 'UNTIL':
          recurrence.until = value;
          break;
      }
    });

    return recurrence;
  }

  // Store calendar info in local database (optional)
  async syncCalendarToLocal(calendar: GoogleCalendar): Promise<void> {
    const { error } = await supabase
      .from('google_calendars')
      .upsert({
        calendar_account_id: calendar.calendar_account_id,
        google_calendar_id: calendar.google_calendar_id,
        name: calendar.name,
        description: calendar.description,
        time_zone: calendar.time_zone,
        color_id: calendar.color_id,
        is_primary: calendar.is_primary,
        access_role: calendar.access_role,
        is_visible: calendar.is_visible,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'calendar_account_id,google_calendar_id'
      });

    if (error) throw error;
  }

  // Store events in local database (optional)
  async syncEventsToLocal(events: CalendarEvent[]): Promise<void> {
    if (events.length === 0) return;

    const { error } = await supabase
      .from('calendar_events')
      .upsert(events.map(event => ({
        ...event,
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      })), {
        onConflict: 'google_event_id'
      });

    if (error) throw error;
  }
}

export const googleCalendarService = new GoogleCalendarService();