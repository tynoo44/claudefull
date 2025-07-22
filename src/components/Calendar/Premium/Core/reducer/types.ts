import type {
  CalendarUIState,
  MultiCalendarState,
  CalendarView,
  DateRange,
} from '../../../../../types/premium-calendar';
import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';

// =============================================================================
// STATE TYPES
// =============================================================================

export interface PremiumCalendarState {
  uiState: CalendarUIState;
  multiCalendarState: MultiCalendarState;
  calendars: Map<string, GoogleCalendar>;
  events: Map<string, CalendarEvent>;
  viewportEvents: Set<string>;
  loadedDateRange: DateRange;
  cacheStatus: {
    lastSync: Date | null;
    isOnline: boolean;
    needsRefresh: boolean;
    syncInProgress: boolean;
  };
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export type PremiumCalendarAction =
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SELECT_EVENT'; payload: { eventId: string; multi: boolean } }
  | { type: 'TOGGLE_CALENDAR'; payload: string }
  | { type: 'SET_CALENDARS'; payload: GoogleCalendar[] }
  | { type: 'SET_EVENTS'; payload: CalendarEvent[] }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: { eventId: string; updates: Partial<CalendarEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'UPDATE_VIEWPORT'; payload: Set<string> }
  | { type: 'TOGGLE_SIDEBAR'; payload?: boolean }
  | { type: 'SET_DETAIL_PANEL'; payload: string | null }
  | { type: 'LOAD_FROM_CACHE'; payload: { events: CalendarEvent[]; calendars: GoogleCalendar[] } }
  | { type: 'UPDATE_CACHE_STATUS'; payload: { lastSync: Date; needsRefresh: boolean } };

// =============================================================================
// INITIAL STATE
// =============================================================================

export const createInitialState = (): PremiumCalendarState => ({
  uiState: {
    currentView: 'month',
    currentDate: new Date(),
    selectedEvents: new Set(),
    detailPanelOpen: false,
    sidebarOpen: true,
    sidebarTab: 'calendars',
    isLoading: false,
  },
  multiCalendarState: {
    selectedCalendars: new Set(),
    calendarSettings: new Map(),
    calendarGroups: [],
    overlaySettings: {
      mode: 'merge',
      colorScheme: 'auto',
      showConflicts: true,
      conflictResolution: 'highlight',
    },
    activeFilters: {},
  },
  calendars: new Map(),
  events: new Map(),
  viewportEvents: new Set(),
  loadedDateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  },
  cacheStatus: {
    lastSync: null,
    isOnline: navigator.onLine,
    needsRefresh: true,
    syncInProgress: false,
  },
});