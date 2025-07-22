// Google Calendar List Edge Function v2
// Gets user's Google calendars using provider token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSuccessResponse, createErrorResponse, validateRequiredFields, logSecurely, handleCors } from '../shared/utils.ts';
import { createValidatedGoogleClient } from '../shared/google-calendar-client.ts';

interface GetCalendarListRequest {
  providerToken: string;
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
    const requestData: GetCalendarListRequest = await req.json();
    
    const validationError = validateRequiredFields(requestData, ['providerToken']);
    if (validationError) {
      return createErrorResponse(validationError);
    }

    // Log request securely
    logSecurely('Google Calendar list requested', {
      action: 'get_calendar_list'
    });

    // Create validated Google Calendar client
    const googleClient = await createValidatedGoogleClient(requestData.providerToken);

    // Get user's calendar list
    const calendars = await googleClient.getCalendarList();

    logSecurely('Google Calendar list retrieved', {
      action: 'get_calendar_list',
      calendarCount: calendars.length
    });

    return createSuccessResponse(calendars);

  } catch (error) {
    console.error('Error in get-google-calendar-list-v2:', error);
    
    logSecurely('Calendar list retrieval failed', {
      error: error.message,
      action: 'get_calendar_list'
    });

    // Handle specific Google API errors
    if (error.message.includes('Invalid or expired')) {
      return createErrorResponse('Google Calendar access token is invalid or expired. Please re-authenticate.', 401);
    }

    if (error.message.includes('insufficient')) {
      return createErrorResponse('Insufficient permissions to access Google Calendar. Please grant calendar permissions.', 403);
    }

    return createErrorResponse('Failed to retrieve calendar list', 500);
  }
});