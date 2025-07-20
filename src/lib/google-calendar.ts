import { google } from 'googleapis';
import { supabase } from './supabase';
import type { CalendarAccount, GoogleCalendar, CalendarEvent, CreateEventRequest, UpdateEventRequest } from '../types/calendar';

// Google Calendar API configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${window.location.origin}/calendar/auth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
  'profile'
];

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
  }

  // Generate authorization URL for Google OAuth
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  // Handle OAuth callback and store credentials
  async handleAuthCallback(code: string, userId: string): Promise<CalendarAccount> {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const calendarAccount: Omit<CalendarAccount, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        google_account_id: userInfo.data.id!,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expires_at: new Date(tokens.expiry_date!).toISOString(),
        email: userInfo.data.email!,
        display_name: userInfo.data.name || undefined
      };

      // Store in database
      const { data, error } = await supabase
        .from('calendar_accounts')
        .upsert(calendarAccount, { 
          onConflict: 'user_id,google_account_id' 
        })
        .select()
        .single();

      if (error) throw error;

      // Sync calendars after connecting
      await this.syncCalendars(data.id);

      return data;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    }
  }

  // Get stored calendar accounts for user
  async getCalendarAccounts(userId: string): Promise<CalendarAccount[]> {
    const { data, error } = await supabase
      .from('calendar_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Set up authenticated calendar client
  private async setupAuthClient(accountId: string): Promise<any> {
    const { data: account, error } = await supabase
      .from('calendar_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) throw error;

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(account.expires_at);

    if (now >= expiresAt) {
      // Token expired, refresh it
      this.oauth2Client.setCredentials({
        refresh_token: account.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update stored tokens
      await supabase
        .from('calendar_accounts')
        .update({
          access_token: credentials.access_token,
          expires_at: new Date(credentials.expiry_date!).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      this.oauth2Client.setCredentials(credentials);
    } else {
      // Token still valid
      this.oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token
      });
    }

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Sync calendars from Google
  async syncCalendars(accountId: string): Promise<GoogleCalendar[]> {
    try {
      const calendar = await this.setupAuthClient(accountId);
      const { data: calendarList } = await calendar.calendarList.list();

      const calendars: Omit<GoogleCalendar, 'id' | 'created_at' | 'updated_at'>[] = 
        calendarList.items?.map((cal: any) => ({
          calendar_account_id: accountId,
          google_calendar_id: cal.id,
          name: cal.summary,
          description: cal.description,
          time_zone: cal.timeZone,
          color_id: cal.colorId,
          is_primary: cal.primary || false,
          access_role: cal.accessRole,
          is_visible: !cal.hidden && !cal.deleted
        })) || [];

      // Upsert calendars
      const { data, error } = await supabase
        .from('google_calendars')
        .upsert(calendars, { 
          onConflict: 'calendar_account_id,google_calendar_id' 
        })
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error syncing calendars:', error);
      throw error;
    }
  }

  // Get calendars for user
  async getUserCalendars(userId: string): Promise<GoogleCalendar[]> {
    const { data, error } = await supabase
      .from('google_calendars')
      .select(`
        *,
        calendar_accounts!inner (
          user_id
        )
      `)
      .eq('calendar_accounts.user_id', userId)
      .eq('is_visible', true)
      .order('is_primary', { ascending: false })
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Sync events from Google for a specific calendar
  async syncEvents(calendarId: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      const { data: googleCalendar, error: calError } = await supabase
        .from('google_calendars')
        .select('*, calendar_accounts(*)')
        .eq('id', calendarId)
        .single();

      if (calError) throw calError;

      const calendar = await this.setupAuthClient(googleCalendar.calendar_accounts.id);

      const { data: eventList } = await calendar.events.list({
        calendarId: googleCalendar.google_calendar_id,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>[] = 
        eventList.items?.map((event: any) => ({
          user_id: googleCalendar.calendar_accounts.user_id,
          google_calendar_id: calendarId,
          google_event_id: event.id,
          title: event.summary || 'Sin título',
          description: event.description,
          location: event.location,
          start_datetime: event.start?.dateTime || event.start?.date,
          end_datetime: event.end?.dateTime || event.end?.date,
          is_all_day: !!event.start?.date,
          status: event.status,
          visibility: event.visibility || 'default',
          attendees: event.attendees?.map((att: any) => ({
            email: att.email,
            display_name: att.displayName,
            response_status: att.responseStatus,
            is_organizer: att.organizer || false,
            is_resource: att.resource || false
          })) || [],
          reminders: event.reminders?.overrides?.map((rem: any) => ({
            method: rem.method,
            minutes: rem.minutes
          })) || [],
          color_id: event.colorId,
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced'
        })) || [];

      // Upsert events
      const { data, error } = await supabase
        .from('calendar_events')
        .upsert(events, { 
          onConflict: 'google_event_id' 
        })
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error syncing events:', error);
      throw error;
    }
  }

  // Create new event
  async createEvent(eventData: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const { data: googleCalendar, error: calError } = await supabase
        .from('google_calendars')
        .select('*, calendar_accounts(*)')
        .eq('id', eventData.google_calendar_id)
        .single();

      if (calError) throw calError;

      const calendar = await this.setupAuthClient(googleCalendar.calendar_accounts.id);

      // Create event in Google Calendar
      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.is_all_day 
          ? { date: eventData.start_datetime.split('T')[0] }
          : { dateTime: eventData.start_datetime },
        end: eventData.is_all_day
          ? { date: eventData.end_datetime.split('T')[0] }
          : { dateTime: eventData.end_datetime },
        attendees: eventData.attendees?.map(att => ({
          email: att.email,
          displayName: att.display_name
        })),
        reminders: eventData.reminders ? {
          useDefault: false,
          overrides: eventData.reminders
        } : undefined
      };

      const { data: createdEvent } = await calendar.events.insert({
        calendarId: googleCalendar.google_calendar_id,
        resource: googleEvent
      });

      // Store in local database
      const localEvent: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'> = {
        user_id: googleCalendar.calendar_accounts.user_id,
        google_calendar_id: eventData.google_calendar_id,
        google_event_id: createdEvent.id!,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start_datetime: eventData.start_datetime,
        end_datetime: eventData.end_datetime,
        is_all_day: eventData.is_all_day || false,
        status: 'confirmed',
        visibility: 'default',
        attendees: eventData.attendees?.map(att => ({
          ...att,
          response_status: 'needsAction'
        })) || [],
        reminders: eventData.reminders || [],
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced'
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(localEvent)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Update event
  async updateEvent(eventData: UpdateEventRequest): Promise<CalendarEvent> {
    try {
      const { data: existingEvent, error: eventError } = await supabase
        .from('calendar_events')
        .select('*, google_calendars(*, calendar_accounts(*))')
        .eq('id', eventData.id)
        .single();

      if (eventError) throw eventError;

      const calendar = await this.setupAuthClient(existingEvent.google_calendars.calendar_accounts.id);

      // Update in Google Calendar if it's a synced event
      if (existingEvent.google_event_id) {
        const updateData: any = {};
        
        if (eventData.title) updateData.summary = eventData.title;
        if (eventData.description !== undefined) updateData.description = eventData.description;
        if (eventData.location !== undefined) updateData.location = eventData.location;
        
        if (eventData.start_datetime) {
          updateData.start = eventData.is_all_day 
            ? { date: eventData.start_datetime.split('T')[0] }
            : { dateTime: eventData.start_datetime };
        }
        
        if (eventData.end_datetime) {
          updateData.end = eventData.is_all_day
            ? { date: eventData.end_datetime.split('T')[0] }
            : { dateTime: eventData.end_datetime };
        }

        await calendar.events.patch({
          calendarId: existingEvent.google_calendars.google_calendar_id,
          eventId: existingEvent.google_event_id,
          resource: updateData
        });
      }

      // Update in local database
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...eventData,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', eventData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const { data: existingEvent, error: eventError } = await supabase
        .from('calendar_events')
        .select('*, google_calendars(*, calendar_accounts(*))')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Delete from Google Calendar if it's a synced event
      if (existingEvent.google_event_id) {
        const calendar = await this.setupAuthClient(existingEvent.google_calendars.calendar_accounts.id);
        
        await calendar.events.delete({
          calendarId: existingEvent.google_calendars.google_calendar_id,
          eventId: existingEvent.google_event_id
        });
      }

      // Delete from local database
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Get events for date range
  async getEvents(userId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        google_calendars (
          name,
          color_id,
          is_primary
        )
      `)
      .eq('user_id', userId)
      .gte('start_datetime', startDate)
      .lte('start_datetime', endDate)
      .order('start_datetime');

    if (error) throw error;
    return data || [];
  }

  // Disconnect Google account
  async disconnectAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
  }
}

export const googleCalendarService = new GoogleCalendarService();