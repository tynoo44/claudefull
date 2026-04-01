// Google Calendar Update Event Edge Function v2
// Updates an existing event in Google Calendar using provider token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  sanitizeInput,
  logSecurely,
  handleCors,
} from '../shared/utils.ts';
import {
  createValidatedGoogleClient,
  GoogleCalendarEvent,
} from '../shared/google-calendar-client.ts';

interface UpdateCalendarEventRequest {
  providerToken: string;
  calendarId?: string;
  eventId: string;
  event: Partial<GoogleCalendarEvent>;
}

serve(async req => {
  try {
    // Handle CORS preflight
    const corsResponse = await handleCors(req);
    if (corsResponse) return corsResponse;

    // Only accept POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse and validate request
    const requestData: UpdateCalendarEventRequest = await req.json();

    const validationError = validateRequiredFields(requestData, [
      'providerToken',
      'eventId',
      'event',
    ]);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Validate event ID
    if (!requestData.eventId || requestData.eventId.trim().length === 0) {
      return createErrorResponse('Event ID is required');
    }

    // Default values
    const calendarId = requestData.calendarId || 'primary';

    // Sanitize event data (only provided fields)
    const sanitizedEvent: Partial<GoogleCalendarEvent> = {};

    if (requestData.event.summary !== undefined) {
      sanitizedEvent.summary = sanitizeInput(requestData.event.summary, 500);
    }

    if (requestData.event.description !== undefined) {
      sanitizedEvent.description = requestData.event.description
        ? sanitizeInput(requestData.event.description, 2000)
        : undefined;
    }

    if (requestData.event.start !== undefined) {
      sanitizedEvent.start = requestData.event.start;
    }

    if (requestData.event.end !== undefined) {
      sanitizedEvent.end = requestData.event.end;
    }

    if (requestData.event.location !== undefined) {
      sanitizedEvent.location = requestData.event.location
        ? sanitizeInput(requestData.event.location, 500)
        : undefined;
    }

    if (requestData.event.attendees !== undefined) {
      sanitizedEvent.attendees = requestData.event.attendees?.map(attendee => ({
        email: sanitizeInput(attendee.email, 100),
        displayName: attendee.displayName ? sanitizeInput(attendee.displayName, 100) : undefined,
        responseStatus: attendee.responseStatus,
      }));
    }

    if (requestData.event.reminders !== undefined) {
      sanitizedEvent.reminders = requestData.event.reminders;
    }

    if (requestData.event.colorId !== undefined) {
      sanitizedEvent.colorId = requestData.event.colorId;
    }

    if (requestData.event.visibility !== undefined) {
      sanitizedEvent.visibility = requestData.event.visibility;
    }

    if (requestData.event.status !== undefined) {
      sanitizedEvent.status = requestData.event.status;
    }

    // Log request securely
    logSecurely('Google Calendar event update requested', {
      action: 'update_calendar_event',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      eventId: requestData.eventId.substring(0, 8) + '...',
      fieldsToUpdate: Object.keys(sanitizedEvent),
    });

    // Create validated Google Calendar client
    const googleClient = await createValidatedGoogleClient(requestData.providerToken);

    // Update the event
    const updatedEvent = await googleClient.updateEvent(
      calendarId,
      requestData.eventId,
      sanitizedEvent,
    );

    logSecurely('Google Calendar event updated', {
      action: 'update_calendar_event',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      eventId: updatedEvent.id?.substring(0, 8) + '...',
    });

    return createSuccessResponse(updatedEvent);
  } catch (error) {
    console.error('Error in update-google-calendar-event-v2:', error);

    logSecurely('Calendar event update failed', {
      error: error.message,
      action: 'update_calendar_event',
    });

    // Handle specific Google API errors
    if (error.message.includes('Invalid or expired')) {
      return createErrorResponse(
        'Google Calendar access token is invalid or expired. Please re-authenticate.',
        401,
      );
    }

    if (error.message.includes('insufficient')) {
      return createErrorResponse(
        'Insufficient permissions to update calendar events. Please grant calendar permissions.',
        403,
      );
    }

    if (error.message.includes('notFound')) {
      return createErrorResponse('Calendar or event not found or not accessible.', 404);
    }

    if (error.message.includes('invalid')) {
      return createErrorResponse('Invalid event data provided.', 400);
    }

    return createErrorResponse('Failed to update calendar event', 500);
  }
});
