// Google Calendar Events Edge Function v2
// Gets events from a Google calendar using provider token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSuccessResponse, createErrorResponse, validateRequiredFields, logSecurely, handleCors } from '../shared/utils.ts';
import { createValidatedGoogleClient } from '../shared/google-calendar-client.ts';

interface GetCalendarEventsRequest {
  providerToken: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    const corsResponse = await handleCors(req);
    if (corsResponse) return corsResponse;

    // Only accept POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse and validate request
    const requestData: GetCalendarEventsRequest = await req.json();
    
    const validationError = validateRequiredFields(requestData, ['providerToken']);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Default values
    const calendarId = requestData.calendarId || 'primary';
    const maxResults = requestData.maxResults || 2500;

    // Log request securely
    logSecurely('Google Calendar events requested', {
      action: 'get_calendar_events',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      hasTimeRange: !!(requestData.timeMin || requestData.timeMax)
    });

    // Create validated Google Calendar client
    const googleClient = await createValidatedGoogleClient(requestData.providerToken);

    // Get calendar events
    const events = await googleClient.getEvents(
      calendarId,
      requestData.timeMin,
      requestData.timeMax,
      maxResults
    );

    logSecurely('Google Calendar events retrieved', {
      action: 'get_calendar_events',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      eventCount: events.length
    });

    return createSuccessResponse(events);

  } catch (error) {
    console.error('Error in get-google-calendar-events-v2:', error);
    
    logSecurely('Calendar events retrieval failed', {
      error: error.message,
      action: 'get_calendar_events'
    });

    // Handle specific Google API errors
    if (error.message.includes('Invalid or expired')) {
      return createErrorResponse('Google Calendar access token is invalid or expired. Please re-authenticate.', 401);
    }

    if (error.message.includes('insufficient')) {
      return createErrorResponse('Insufficient permissions to access Google Calendar. Please grant calendar permissions.', 403);
    }

    if (error.message.includes('notFound')) {
      return createErrorResponse('Calendar not found or not accessible.', 404);
    }

    return createErrorResponse('Failed to retrieve calendar events', 500);
  }
});