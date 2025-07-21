import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  PremiumCalendarContextType,
  CalendarUIState,
  MultiCalendarState,
  CalendarView,
  DateRange,
} from '../../../../types/premium-calendar';
import type { CalendarEvent, GoogleCalendar } from '../../../../types/calendar';

// =============================================================================
// CONTEXT DEFINITION
// =============================================================================

const PremiumCalendarContext = createContext<PremiumCalendarContextType | null>(null);

// =============================================================================
// STATE TYPES & ACTIONS
// =============================================================================

interface PremiumCalendarState {
  uiState: CalendarUIState;
  multiCalendarState: MultiCalendarState;
  calendars: Map<string, GoogleCalendar>;
  events: Map<string, CalendarEvent>;
  viewportEvents: Set<string>;
  loadedDateRange: DateRange;
}

type PremiumCalendarAction =
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
  | { type: 'SET_DETAIL_PANEL'; payload: string | null };

// =============================================================================
// INITIAL STATE
// =============================================================================

const createInitialState = (): PremiumCalendarState => ({
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
});

// =============================================================================
// REDUCER
// =============================================================================

const premiumCalendarReducer = (
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

    case 'SELECT_EVENT':
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

    case 'TOGGLE_CALENDAR':
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

    case 'SET_CALENDARS':
      const calendarsMap = new Map<string, GoogleCalendar>();
      action.payload.forEach(calendar => {
        calendarsMap.set(calendar.id, calendar);
      });

      return {
        ...state,
        calendars: calendarsMap,
      };

    case 'SET_EVENTS':
      const eventsMap = new Map<string, CalendarEvent>();
      action.payload.forEach(event => {
        eventsMap.set(event.id, event);
      });

      return {
        ...state,
        events: eventsMap,
      };

    case 'ADD_EVENT':
      const newEvents = new Map(state.events);
      newEvents.set(action.payload.id, action.payload);

      return {
        ...state,
        events: newEvents,
      };

    case 'UPDATE_EVENT':
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

    case 'DELETE_EVENT':
      const eventsAfterDelete = new Map(state.events);
      eventsAfterDelete.delete(action.payload);

      return {
        ...state,
        events: eventsAfterDelete,
      };

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
          detailPanelEventId: action.payload,
        },
      };

    default:
      return state;
  }
};

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface PremiumCalendarProviderProps {
  children: React.ReactNode;
  initialView?: CalendarView;
  initialDate?: Date;
}

export const PremiumCalendarProvider: React.FC<PremiumCalendarProviderProps> = ({
  children,
  initialView = 'month',
  initialDate = new Date(),
}) => {
  const [state, dispatch] = useReducer(premiumCalendarReducer, createInitialState());

  // Initialize with custom values
  useEffect(() => {
    if (initialView !== state.uiState.currentView) {
      dispatch({ type: 'SET_VIEW', payload: initialView });
    }
    if (initialDate.getTime() !== state.uiState.currentDate.getTime()) {
      dispatch({ type: 'SET_DATE', payload: initialDate });
    }
  }, [initialView, initialDate, state.uiState.currentView, state.uiState.currentDate]);

  // =============================================================================
  // CONTEXT METHODS
  // =============================================================================

  const setView = useCallback((view: CalendarView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const navigateDate = useCallback(
    (direction: 'prev' | 'next' | Date) => {
      if (direction instanceof Date) {
        dispatch({ type: 'SET_DATE', payload: direction });
        return;
      }

      const currentDate = state.uiState.currentDate;
      const currentView = state.uiState.currentView;
      let newDate: Date;

      switch (currentView) {
        case 'month':
          newDate = new Date(currentDate);
          newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'day':
          newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        default:
          newDate = currentDate;
      }

      dispatch({ type: 'SET_DATE', payload: newDate });
    },
    [state.uiState.currentDate, state.uiState.currentView],
  );

  const selectEvent = useCallback((eventId: string, multi: boolean = false) => {
    dispatch({ type: 'SELECT_EVENT', payload: { eventId, multi } });
  }, []);

  const toggleCalendar = useCallback((calendarId: string) => {
    dispatch({ type: 'TOGGLE_CALENDAR', payload: calendarId });
  }, []);

  const updateCalendarSettings = useCallback((calendarId: string, settings: any) => {
    // TODO: Implement calendar settings update
    console.log('updateCalendarSettings:', calendarId, settings);
  }, []);

  // Event operations (placeholder implementations)
  const createEvent = useCallback(async (event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    // TODO: Integrate with GoogleCalendarService
    const newEvent: CalendarEvent = {
      id: `temp-${Date.now()}`,
      user_id: 'current-user',
      google_calendar_id: 'primary',
      title: event.title || 'Nuevo Evento',
      start_datetime: event.start_datetime || new Date().toISOString(),
      end_datetime: event.end_datetime || new Date(Date.now() + 3600000).toISOString(),
      is_all_day: event.is_all_day || false,
      status: 'confirmed',
      visibility: 'default',
      attendees: event.attendees || [],
      reminders: event.reminders || [],
      sync_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...event,
    } as CalendarEvent;

    dispatch({ type: 'ADD_EVENT', payload: newEvent });
    return newEvent;
  }, []);

  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      // TODO: Integrate with GoogleCalendarService
      dispatch({ type: 'UPDATE_EVENT', payload: { eventId, updates } });
      const updatedEvent = state.events.get(eventId);
      return updatedEvent!;
    },
    [state.events],
  );

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    // TODO: Integrate with GoogleCalendarService
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
  }, []);

  const duplicateEvent = useCallback(
    async (eventId: string): Promise<CalendarEvent> => {
      const originalEvent = state.events.get(eventId);
      if (!originalEvent) {
        throw new Error('Event not found');
      }

      const duplicatedEvent = {
        ...originalEvent,
        id: `dup-${Date.now()}`,
        title: `${originalEvent.title} (Copia)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_EVENT', payload: duplicatedEvent });
      return duplicatedEvent;
    },
    [state.events],
  );

  // Placeholder implementations for other methods
  const startDrag = useCallback((event: CalendarEvent, dragType: any) => {
    console.log('startDrag:', event, dragType);
  }, []);

  const updateDrag = useCallback((position: any) => {
    console.log('updateDrag:', position);
  }, []);

  const completeDrag = useCallback(async (dropTarget: any) => {
    console.log('completeDrag:', dropTarget);
    return { success: true };
  }, []);

  const cancelDrag = useCallback(() => {
    console.log('cancelDrag');
  }, []);

  const searchEvents = useCallback(async (query: string, filters?: any) => {
    console.log('searchEvents:', query, filters);
    return { events: [], totalCount: 0, facets: {}, suggestions: [] };
  }, []);

  const applyFilters = useCallback((filters: any) => {
    console.log('applyFilters:', filters);
  }, []);

  const clearFilters = useCallback(() => {
    console.log('clearFilters');
  }, []);

  const getUsageMetrics = useCallback(async (dateRange: DateRange) => {
    console.log('getUsageMetrics:', dateRange);
    return {} as any;
  }, []);

  const getProductivityInsights = useCallback(async () => {
    console.log('getProductivityInsights');
    return {} as any;
  }, []);

  const suggestScheduling = useCallback(async (request: any) => {
    console.log('suggestScheduling:', request);
    return [];
  }, []);

  const getEventInsights = useCallback(async (eventId: string) => {
    console.log('getEventInsights:', eventId);
    return {} as any;
  }, []);

  const subscribeToUpdates = useCallback((calendarIds: string[]) => {
    console.log('subscribeToUpdates:', calendarIds);
    return () => {};
  }, []);

  const broadcastUpdate = useCallback((update: any) => {
    console.log('broadcastUpdate:', update);
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: PremiumCalendarContextType = {
    // State
    uiState: state.uiState,
    multiCalendarState: state.multiCalendarState,
    dragState: null, // TODO: Implement drag state

    // Data
    calendars: state.calendars,
    events: state.events,
    eventTemplates: [], // TODO: Implement event templates
    contacts: new Map(), // TODO: Implement contacts

    // Performance
    viewportEvents: state.viewportEvents,
    loadedDateRange: state.loadedDateRange,
    metrics: {
      renderTime: 0,
      eventCount: state.events.size,
      cacheHitRate: 0,
      memoryUsage: 0,
      scrollPerformance: 60,
    },

    // Actions
    setView,
    navigateDate,
    selectEvent,
    toggleCalendar,
    updateCalendarSettings,

    // Event operations
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,

    // Drag & drop
    startDrag,
    updateDrag,
    completeDrag,
    cancelDrag,

    // Search & filter
    searchEvents,
    applyFilters,
    clearFilters,

    // Analytics
    getUsageMetrics,
    getProductivityInsights,

    // Smart features
    suggestScheduling,
    getEventInsights,

    // Real-time
    subscribeToUpdates,
    broadcastUpdate,
  };

  return (
    <PremiumCalendarContext.Provider value={contextValue}>
      {children}
    </PremiumCalendarContext.Provider>
  );
};

// =============================================================================
// HOOK
// =============================================================================

export const usePremiumCalendar = (): PremiumCalendarContextType => {
  const context = useContext(PremiumCalendarContext);
  if (!context) {
    throw new Error('usePremiumCalendar must be used within a PremiumCalendarProvider');
  }
  return context;
};
