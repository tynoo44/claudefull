import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';
import type { PremiumCalendarState, PremiumCalendarAction } from './types';

// =============================================================================
// REDUCER
// =============================================================================

export const premiumCalendarReducer = (
  state: PremiumCalendarState,
  action: PremiumCalendarAction,
): PremiumCalendarState => {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          currentView: action.payload,
        },
      };

    case 'SET_DATE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          currentDate: action.payload,
        },
      };

    case 'SELECT_EVENT': {
      const { eventId, multi } = action.payload;
      const newSelectedEvents = new Set(multi ? state.uiState.selectedEvents : []);

      if (newSelectedEvents.has(eventId)) {
        newSelectedEvents.delete(eventId);
      } else {
        newSelectedEvents.add(eventId);
      }

      return {
        ...state,
        uiState: {
          ...state.uiState,
          selectedEvents: newSelectedEvents,
        },
      };
    }

    case 'TOGGLE_CALENDAR': {
      const calendarId = action.payload;
      const newSelectedCalendars = new Set(state.multiCalendarState.selectedCalendars);

      if (newSelectedCalendars.has(calendarId)) {
        newSelectedCalendars.delete(calendarId);
      } else {
        newSelectedCalendars.add(calendarId);
      }

      return {
        ...state,
        multiCalendarState: {
          ...state.multiCalendarState,
          selectedCalendars: newSelectedCalendars,
        },
      };
    }

    case 'SET_CALENDARS': {
      const calendarsMap = new Map<string, GoogleCalendar>();
      action.payload.forEach(calendar => {
        calendarsMap.set(calendar.id, calendar);
      });

      return {
        ...state,
        calendars: calendarsMap,
      };
    }

    case 'SET_EVENTS': {
      const eventsMap = new Map<string, CalendarEvent>();
      action.payload.forEach(event => {
        eventsMap.set(event.id, event);
      });

      return {
        ...state,
        events: eventsMap,
      };
    }

    case 'ADD_EVENT': {
      const newEvents = new Map(state.events);
      newEvents.set(action.payload.id, action.payload);

      return {
        ...state,
        events: newEvents,
      };
    }

    case 'UPDATE_EVENT': {
      const { eventId: updateEventId, updates } = action.payload;
      const updatedEvents = new Map(state.events);
      const existingEvent = updatedEvents.get(updateEventId);

      if (existingEvent) {
        updatedEvents.set(updateEventId, { ...existingEvent, ...updates });
      }

      return {
        ...state,
        events: updatedEvents,
      };
    }

    case 'DELETE_EVENT': {
      const eventsAfterDelete = new Map(state.events);
      eventsAfterDelete.delete(action.payload);

      return {
        ...state,
        events: eventsAfterDelete,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isLoading: action.payload,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          error: action.payload,
        },
      };

    case 'UPDATE_VIEWPORT':
      return {
        ...state,
        viewportEvents: action.payload,
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          sidebarOpen: action.payload ?? !state.uiState.sidebarOpen,
        },
      };

    case 'SET_DETAIL_PANEL':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          detailPanelOpen: action.payload !== null,
          detailPanelEventId: action.payload ?? undefined,
        },
      };

    case 'LOAD_FROM_CACHE': {
      const cachedCalendars = new Map<string, GoogleCalendar>();
      action.payload.calendars.forEach(calendar => {
        cachedCalendars.set(calendar.id, calendar);
      });

      const cachedEvents = new Map<string, CalendarEvent>();
      action.payload.events.forEach(event => {
        cachedEvents.set(event.id, event);
      });

      return {
        ...state,
        calendars: cachedCalendars,
        events: cachedEvents,
        uiState: {
          ...state.uiState,
          isLoading: false,
        },
      };
    }

    case 'UPDATE_CACHE_STATUS':
      return {
        ...state,
        cacheStatus: {
          ...state.cacheStatus,
          lastSync: action.payload.lastSync,
          needsRefresh: action.payload.needsRefresh,
        },
      };

    default:
      return state;
  }
};