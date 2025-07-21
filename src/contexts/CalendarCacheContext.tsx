import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { GoogleCalendarService } from '../lib/google-calendar';
import { calendarCache } from '../lib/calendar-cache';
import type {
  CalendarEvent as DBCalendarEvent,
  GoogleCalendar as DBGoogleCalendar,
} from '../types/calendar';

// Local interfaces for UI compatibility
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  calendarId: string;
  calendarName: string;
  description?: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
  }>;
  isAllDay?: boolean;
  isRecurring?: boolean;
  meetingLink?: string;
}

interface GoogleCalendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface CalendarCacheContextType {
  events: CalendarEvent[];
  calendars: GoogleCalendar[];
  isLoading: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  loadedMonths: Set<string>; // Track which months are loaded
  forceRefresh: () => Promise<void>;
  loadMonth: (date: Date) => Promise<void>; // Load specific month
}

const CalendarCacheContext = createContext<CalendarCacheContextType | undefined>(undefined);

interface CalendarCacheProviderProps {
  children: ReactNode;
}

export const CalendarCacheProvider: React.FC<CalendarCacheProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());

  // Helper function to generate month key
  const getMonthKey = (date: Date): string => {
    return format(date, 'yyyy-MM');
  };

  // Load cache - filter for current month only
  const loadFromCache = () => {
    console.log('🔄 Loading calendar data from cache...');

    try {
      const cachedDbEvents: DBCalendarEvent[] = calendarCache.getAllEvents();
      const cachedDbCalendars: DBGoogleCalendar[] = calendarCache.getAllCalendars();

      console.log('📱 Total in cache:', {
        events: cachedDbEvents.length,
        calendars: cachedDbCalendars.length,
      });

      if (cachedDbEvents.length > 0) {
        // Filter ONLY current month events from cache
        const currentMonth = getMonthKey(new Date());
        const currentMonthEvents = cachedDbEvents.filter(event => {
          const eventMonth = getMonthKey(new Date(event.start_datetime));
          return eventMonth === currentMonth;
        });

        console.log(
          `📅 Filtered to current month (${currentMonth}): ${currentMonthEvents.length} events`,
        );

        // Convert DB events to UI format
        const uiEvents: CalendarEvent[] = currentMonthEvents.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_datetime),
          end: new Date(event.end_datetime),
          color: event.color_id ? `#${event.color_id}` : '#3b82f6',
          calendarId: event.google_calendar_id,
          calendarName: '', // Will be filled from calendars
          description: event.description,
          location: event.location,
          isAllDay: event.is_all_day,
          attendees:
            event.attendees?.map(att => ({
              email: att.email,
              name: att.display_name,
              status:
                att.response_status === 'needsAction'
                  ? 'pending'
                  : att.response_status === 'accepted'
                    ? 'accepted'
                    : att.response_status === 'declined'
                      ? 'declined'
                      : 'tentative',
            })) || [],
        }));

        setEvents(uiEvents);

        // Only mark current month as loaded if we have events
        if (currentMonthEvents.length > 0) {
          setLoadedMonths(new Set([currentMonth]));
        }

        setIsLoading(false);
      }

      if (cachedDbCalendars.length > 0) {
        // Convert DB calendars to UI format
        const uiCalendars: GoogleCalendar[] = cachedDbCalendars.map(cal => ({
          id: cal.google_calendar_id,
          name: cal.name,
          color: cal.color_id ? `#${cal.color_id}` : '#3b82f6',
          visible: cal.is_visible,
        }));

        setCalendars(uiCalendars);
      }
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
    }
  };

  // Load specific month of events - ONLY when requested
  const loadMonth = useCallback(
    async (date: Date) => {
      const monthKey = getMonthKey(date);

      // Skip if already loaded
      if (loadedMonths.has(monthKey)) {
        console.log(`📅 Month ${monthKey} already loaded, skipping...`);
        return;
      }

      if (syncInProgress) {
        console.log('⏳ Sync already in progress, skipping month load...');
        return;
      }

      console.log(`🔄 LOADING MONTH ON DEMAND: ${monthKey}`);
      setSyncInProgress(true);
      setIsLoading(true);

      try {
        const calendarService = new GoogleCalendarService();

        // Check if user has Google access
        const hasAccess = await calendarService.hasGoogleAccess();
        if (!hasAccess) {
          console.log('⚠️ No Google access, using cached data only');
          setIsLoading(false);
          setSyncInProgress(false);
          return;
        }

        // Initialize calendars ONLY if this is the first load
        if (calendars.length === 0) {
          console.log('🔄 First time load - getting calendars...');
          const googleCalendars = await calendarService.getUserCalendars();

          // Load visibility preferences
          const savedVisibility = localStorage.getItem('calendar-visibility');
          let visibilityMap: Record<string, boolean> = {};
          if (savedVisibility) {
            try {
              visibilityMap = JSON.parse(savedVisibility);
            } catch (error) {
              console.error('Error parsing saved visibility:', error);
            }
          }

          const formattedCalendars: GoogleCalendar[] = googleCalendars.map(cal => ({
            id: cal.google_calendar_id,
            name: cal.name,
            color: cal.color_id ? `#${cal.color_id}` : '#3b82f6',
            visible:
              visibilityMap[cal.google_calendar_id] !== undefined
                ? visibilityMap[cal.google_calendar_id]
                : true,
          }));

          setCalendars(formattedCalendars);

          // Save calendars to cache
          formattedCalendars.forEach(calendar => {
            const dbCalendar: DBGoogleCalendar = {
              id: calendar.id,
              calendar_account_id: '',
              google_calendar_id: calendar.id,
              name: calendar.name,
              description: '',
              color_id: calendar.color.replace('#', ''),
              is_primary: false,
              access_role: 'reader',
              is_visible: calendar.visible,
              time_zone: 'UTC',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            calendarCache.cacheCalendar(dbCalendar);
          });
        }

        // Calculate month range - SOLO ESTE MES
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        console.log(
          `📅 Loading ONLY events from ${monthStart.toISOString()} to ${monthEnd.toISOString()}`,
        );

        // Get events ONLY for this specific month from all calendars
        const monthEvents: CalendarEvent[] = [];
        const calendarsToUse = calendars.length > 0 ? calendars : [];

        for (const calendar of calendarsToUse) {
          try {
            const calendarEvents: DBCalendarEvent[] = await calendarService.getEvents(
              calendar.id,
              monthStart.toISOString(),
              monthEnd.toISOString(),
            );

            const formattedEvents: CalendarEvent[] = calendarEvents.map(event => ({
              id: event.id,
              title: event.title,
              start: new Date(event.start_datetime),
              end: new Date(event.end_datetime),
              color: calendar.color,
              calendarId: calendar.id,
              calendarName: calendar.name,
              description: event.description,
              location: event.location,
              isAllDay: event.is_all_day,
              attendees: event.attendees?.map(att => ({
                email: att.email,
                name: att.display_name,
                status: 'pending' as const,
              })),
            }));

            monthEvents.push(...formattedEvents);

            // Cache events
            calendarEvents.forEach(event => {
              calendarCache.cacheEvent(event);
            });
          } catch (eventError) {
            console.error(`Error loading events for calendar ${calendar.name}:`, eventError);
          }
        }

        // Add new events to existing events (avoid duplicates)
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(e => e.id));
          const newEvents = monthEvents.filter(e => !existingIds.has(e.id));
          return [...prevEvents, ...newEvents];
        });

        // Mark month as loaded
        setLoadedMonths(prev => new Set([...prev, monthKey]));
        setLastSync(new Date());

        console.log(`✅ MONTH LOADED: ${monthEvents.length} events for ${monthKey}`);
        localStorage.setItem('calendar-last-sync', Date.now().toString());
      } catch (error) {
        console.error(`❌ Error loading month ${monthKey}:`, error);
      } finally {
        setIsLoading(false);
        setSyncInProgress(false);
      }
    },
    [calendars, loadedMonths, syncInProgress],
  );

  // Initialize calendars and current month
  const initializeCalendars = async () => {
    if (syncInProgress) {
      console.log('⏳ Sync already in progress, skipping initialization...');
      return;
    }

    setSyncInProgress(true);

    try {
      console.log('🔄 Initializing calendars...');
      const calendarService = new GoogleCalendarService();

      // Check if user has Google access
      const hasAccess = await calendarService.hasGoogleAccess();
      if (!hasAccess) {
        console.log('⚠️ No Google access, using cached data only');
        setSyncInProgress(false);
        setIsLoading(false);
        return;
      }

      // Get calendars
      const googleCalendars: DBGoogleCalendar[] = await calendarService.getUserCalendars();

      // Load visibility preferences
      const savedVisibility = localStorage.getItem('calendar-visibility');
      let visibilityMap: Record<string, boolean> = {};
      if (savedVisibility) {
        try {
          visibilityMap = JSON.parse(savedVisibility);
        } catch (error) {
          console.error('Error parsing saved visibility:', error);
        }
      }

      const formattedCalendars: GoogleCalendar[] = googleCalendars.map(cal => ({
        id: cal.google_calendar_id,
        name: cal.name,
        color: cal.color_id ? `#${cal.color_id}` : '#3b82f6',
        visible:
          visibilityMap[cal.google_calendar_id] !== undefined
            ? visibilityMap[cal.google_calendar_id]
            : true,
      }));

      // Save calendars to cache
      formattedCalendars.forEach(calendar => {
        const dbCalendar: DBGoogleCalendar = {
          id: calendar.id,
          calendar_account_id: '',
          google_calendar_id: calendar.id,
          name: calendar.name,
          description: '',
          color_id: calendar.color.replace('#', ''),
          is_primary: false,
          access_role: 'reader',
          is_visible: calendar.visible,
          time_zone: 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        calendarCache.cacheCalendar(dbCalendar);
      });

      setCalendars(formattedCalendars);
      setLastSync(new Date());
      setIsLoading(false);

      console.log('✅ Calendars initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing calendars:', error);
      setIsLoading(false);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Force refresh function - reload current month
  const forceRefresh = async () => {
    setIsLoading(true);

    // Clear loaded months to force reload
    setLoadedMonths(new Set());

    // Reload calendars and current month
    await initializeCalendars();
    await loadMonth(new Date());

    localStorage.setItem('calendar-last-sync', Date.now().toString());
  };

  // Initialize on mount - SOLO CACHE LOCAL, NO AUTO-SYNC
  useEffect(() => {
    console.log('🚀 Initializing CalendarCacheContext - CACHE ONLY...');

    // Load cache instantly - NO NETWORK CALLS
    loadFromCache();

    // NO automatic sync - only load on demand
    console.log('✅ Cache loaded, no automatic sync - waiting for user navigation');
  }, []);

  const contextValue: CalendarCacheContextType = {
    events,
    calendars,
    isLoading,
    lastSync,
    syncInProgress,
    loadedMonths,
    forceRefresh,
    loadMonth,
  };

  return (
    <CalendarCacheContext.Provider value={contextValue}>{children}</CalendarCacheContext.Provider>
  );
};

export const useCalendarCache = (): CalendarCacheContextType => {
  const context = useContext(CalendarCacheContext);
  if (context === undefined) {
    throw new Error('useCalendarCache must be used within a CalendarCacheProvider');
  }
  return context;
};
