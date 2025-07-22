export interface CalendarAccount {
  id: string;
  user_id: string;
  google_account_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  email: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendar {
  id: string;
  calendar_account_id: string;
  google_calendar_id: string;
  name: string;
  description?: string;
  time_zone?: string;
  color_id?: string;
  is_primary: boolean;
  access_role: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  google_calendar_id: string;
  google_event_id?: string;
  title: string;
  description?: string;
  location?: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private' | 'confidential';
  attendees: EventAttendee[];
  recurrence?: RecurrenceRule;
  reminders: EventReminder[];
  color_id?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
  sync_status: 'synced' | 'pending' | 'error';
}

export interface EventAttendee {
  email: string;
  display_name?: string;
  response_status: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  is_organizer?: boolean;
  is_resource?: boolean;
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: string;
  by_weekday?: number[];
  by_monthday?: number[];
}

export interface EventReminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface CalendarSyncStatus {
  id: string;
  user_id: string;
  calendar_account_id: string;
  last_sync_at: string;
  sync_token?: string;
  status: 'active' | 'error' | 'paused';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day?: boolean;
  attendees?: Omit<EventAttendee, 'response_status'>[];
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;
  meeting_link?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: string;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEventDisplay extends CalendarEvent {
  calendar: GoogleCalendar;
}
