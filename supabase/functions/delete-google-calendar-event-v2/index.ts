// Google Calendar Delete Event Edge Function v2
// Deletes an event from Google Calendar using provider token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  logSecurely,
  handleCors,
} from '../shared/utils.ts';
import { createValidatedGoogleClient } from '../shared/google-calendar-client.ts';

interface DeleteCalendarEventRequest {
  providerToken: string;
  calendarId?: string;
  eventId: string;
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
    const requestData: DeleteCalendarEventRequest = await req.json();

    const validationError = validateRequiredFields(requestData, ['providerToken', 'eventId']);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Validate event ID
    if (!requestData.eventId || requestData.eventId.trim().length === 0) {
      return createErrorResponse('Event ID is required');
    }

    // Default values
    const calendarId = requestData.calendarId || 'primary';

    // Log request securely
    logSecurely('Google Calendar event deletion requested', {
      action: 'delete_calendar_event',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      eventId: requestData.eventId.substring(0, 8) + '...',
    });

    // Create validated Google Calendar client
    const googleClient = await createValidatedGoogleClient(requestData.providerToken);

    // Delete the event
    await googleClient.deleteEvent(calendarId, requestData.eventId);

    logSecurely('Google Calendar event deleted successfully', {
      action: 'delete_calendar_event',
      calendarId: calendarId === 'primary' ? 'primary' : 'custom',
      eventId: requestData.eventId.substring(0, 8) + '...',
    });

    return createSuccessResponse({
      success: true,
      message: 'Event deleted successfully',
      eventId: requestData.eventId,
    });
  } catch (error) {
    console.error('Error in delete-google-calendar-event-v2:', error);

    logSecurely('Calendar event deletion failed', {
      error: error.message,
      action: 'delete_calendar_event',
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
        'Insufficient permissions to delete calendar events. Please grant calendar permissions.',
        403,
      );
    }

    if (error.message.includes('notFound')) {
      return createErrorResponse('Calendar or event not found or not accessible.', 404);
    }

    if (error.message.includes('Gone')) {
      // Event already deleted
      return createSuccessResponse({
        success: true,
        message: 'Event was already deleted',
        eventId: requestData.eventId,
      });
    }

    return createErrorResponse('Failed to delete calendar event', 500);
  }
});
