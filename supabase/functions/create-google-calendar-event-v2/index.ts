// Google Calendar Create Event Edge Function v2
// Creates a new event in Google Calendar using provider token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSuccessResponse, createErrorResponse, validateRequiredFields, sanitizeInput, logSecurely, handleCors } from '../shared/utils.ts';
import { createValidatedGoogleClient, GoogleCalendarEvent } from '../shared/google-calendar-client.ts';

interface CreateCalendarEventRequest {
  providerToken: string;
  calendarId?: string;
  event: GoogleCalendarEvent;
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
    const requestData: CreateCalendarEventRequest = await req.json();
    
    const validationError = validateRequiredFields(requestData, ['providerToken', 'event']);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Validate event data
    if (!requestData.event.summary || requestData.event.summary.trim().length === 0) {
      return createErrorResponse('Event summary is required');
    }

    if (!requestData.event.start || !requestData.event.end) {
      return createErrorResponse('Event start and end times are required');
    }

    // Default values
    const calendarId = requestData.calendarId || 'primary';

    // Sanitize event data
    const sanitizedEvent: GoogleCalendarEvent = {
      summary: sanitizeInput(requestData.event.summary, 500),
      description: requestData.event.description ? sanitizeInput(requestData.event.description, 2000) : undefined,
      start: requestData.event.start,
      end: requestData.event.end,
      location: requestData.event.location ? sanitizeInput(requestData.event.location, 500) : undefined,
      attendees: requestData.event.attendees?.map(attendee => ({
        email: sanitizeInput(attendee.email, 100),
        displayName: attendee.displayName ? sanitizeInput(attendee.displayName, 100) : undefined,
        responseStatus: attendee.responseStatus,
      })),
      reminders: requestData.event.reminders,
      colorId: requestData.event.colorId,
      visibility: requestData.event.visibility,
      status: requestData.event.status,
    };

    // Log request securely
    logSecurely('Google Calendar event creation requested', {
      action: 'create_calendar_event',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      hasAttendees: !!(sanitizedEvent.attendees && sanitizedEvent.attendees.length > 0)
    });

    // Create validated Google Calendar client
    const googleClient = await createValidatedGoogleClient(requestData.providerToken);

    // Create the event
    const createdEvent = await googleClient.createEvent(calendarId, sanitizedEvent);

    logSecurely('Google Calendar event created', {
      action: 'create_calendar_event',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      eventId: createdEvent.id?.substring(0, 8) + '...'
    });

    return createSuccessResponse(createdEvent);

  } catch (error) {
    console.error('Error in create-google-calendar-event-v2:', error);
    
    logSecurely('Calendar event creation failed', {
      error: error.message,
      action: 'create_calendar_event'
    });

    // Handle specific Google API errors
    if (error.message.includes('Invalid or expired')) {
      return createErrorResponse('Google Calendar access token is invalid or expired. Please re-authenticate.', 401);
    }

    if (error.message.includes('insufficient')) {
      return createErrorResponse('Insufficient permissions to create calendar events. Please grant calendar permissions.', 403);
    }

    if (error.message.includes('notFound')) {
      return createErrorResponse('Calendar not found or not accessible.', 404);
    }

    if (error.message.includes('invalid')) {
      return createErrorResponse('Invalid event data provided.', 400);
    }

    return createErrorResponse('Failed to create calendar event', 500);
  }
});