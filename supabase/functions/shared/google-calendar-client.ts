// Shared Google Calendar API client for Edge Functions
import { createSuccessResponse, createErrorResponse, logSecurely } from './utils.ts';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  colorId?: string;
  visibility?: string;
  status?: string;
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId?: string;
  primary?: boolean;
  accessRole?: string;
  hidden?: boolean;
}

export class GoogleCalendarClient {
  private baseUrl = 'https://www.googleapis.com/calendar/v3';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    logSecurely('Google Calendar API request', {
      endpoint: endpoint.split('?')[0], // Log endpoint without query params
      method: options.method || 'GET',
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      logSecurely('Google Calendar API error', {
        status: response.status,
        endpoint: endpoint.split('?')[0],
      });
      throw new Error(`Google Calendar API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList(): Promise<GoogleCalendarInfo[]> {
    try {
      const response = await this.makeRequest('/users/me/calendarList');

      return (
        response.items?.map((cal: any) => ({
          id: cal.id,
          summary: cal.summary || 'Sin nombre',
          description: cal.description,
          timeZone: cal.timeZone || 'UTC',
          colorId: cal.colorId,
          primary: cal.primary || false,
          accessRole: cal.accessRole,
          hidden: cal.hidden || false,
        })) || []
      );
    } catch (error) {
      console.error('Error getting calendar list:', error);
      throw error;
    }
  }

  /**
   * Get events from a calendar
   */
  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 2500,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
      const response = await this.makeRequest(endpoint);

      return (
        response.items?.map((event: any) => ({
          id: event.id,
          summary: event.summary || 'Sin título',
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          attendees: event.attendees,
          reminders: event.reminders,
          colorId: event.colorId,
          visibility: event.visibility,
          status: event.status,
        })) || []
      );
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(
    calendarId: string = 'primary',
    event: GoogleCalendarEvent,
  ): Promise<GoogleCalendarEvent> {
    try {
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events`;

      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(event),
      });

      return {
        id: response.id,
        summary: response.summary,
        description: response.description,
        start: response.start,
        end: response.end,
        location: response.location,
        attendees: response.attendees,
        reminders: response.reminders,
        colorId: response.colorId,
        visibility: response.visibility,
        status: response.status,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    calendarId: string = 'primary',
    eventId: string,
    event: Partial<GoogleCalendarEvent>,
  ): Promise<GoogleCalendarEvent> {
    try {
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;

      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(event),
      });

      return {
        id: response.id,
        summary: response.summary,
        description: response.description,
        start: response.start,
        end: response.end,
        location: response.location,
        attendees: response.attendees,
        reminders: response.reminders,
        colorId: response.colorId,
        visibility: response.visibility,
        status: response.status,
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;

      await this.makeRequest(endpoint, {
        method: 'DELETE',
      });

      logSecurely('Calendar event deleted', {
        calendarId: calendarId === 'primary' ? 'primary' : 'custom',
        eventId: eventId.substring(0, 8) + '...',
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `access_token=${this.accessToken}`,
      });

      if (response.ok) {
        const tokenInfo = await response.json();
        // Check if token has calendar scope
        const scopes = tokenInfo.scope?.split(' ') || [];
        return scopes.some(
          (scope: string) =>
            scope.includes('calendar') ||
            scope.includes('https://www.googleapis.com/auth/calendar'),
        );
      }

      return false;
    } catch (error) {
      console.error('Error validating Google token:', error);
      return false;
    }
  }
}

/**
 * Utility function to create Google Calendar client from provider token
 */
export function createGoogleCalendarClient(providerToken: string): GoogleCalendarClient {
  return new GoogleCalendarClient(providerToken);
}

/**
 * Validate provider token and create client
 */
export async function createValidatedGoogleClient(
  providerToken: string,
): Promise<GoogleCalendarClient> {
  if (!providerToken) {
    throw new Error('Provider token is required');
  }

  const client = new GoogleCalendarClient(providerToken);

  const isValid = await client.validateToken();
  if (!isValid) {
    throw new Error('Invalid or expired Google Calendar access token');
  }

  return client;
}
