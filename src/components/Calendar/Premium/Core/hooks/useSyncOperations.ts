import { useCallback, useRef } from 'react';
import { GoogleCalendarService } from '../../../../../lib/google-calendar';
import { calendarCache } from '../../../../../lib/calendar-cache';
import type { PremiumCalendarAction } from '../reducer/types';

interface UseSyncOperationsProps {
  dispatch: React.Dispatch<PremiumCalendarAction>;
  googleCalendarService: React.MutableRefObject<GoogleCalendarService>;
}

export const useSyncOperations = ({
  dispatch,
  googleCalendarService,
}: UseSyncOperationsProps) => {
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startBackgroundSync = useCallback(async () => {
    if (syncTimeoutRef.current) return; // Already syncing

    try {
      dispatch({
        type: 'UPDATE_CACHE_STATUS',
        payload: { lastSync: new Date(), needsRefresh: true },
      });

      // Get fresh data from Google Calendar
      const [calendars, events] = await Promise.all([
        googleCalendarService.current.getUserCalendars(),
        googleCalendarService.current.getEvents(
          'primary',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ahead
        ),
      ]);

      // Update cache
      calendars.forEach(cal => calendarCache.cacheCalendar(cal));
      calendarCache.cacheEvents(events);
      calendarCache.markAsSynced();

      // Update UI with fresh data
      dispatch({ type: 'SET_CALENDARS', payload: calendars });
      dispatch({ type: 'SET_EVENTS', payload: events });

      console.log(`✅ SYNC COMPLETE: ${events.length} events, ${calendars.length} calendars`);

      dispatch({
        type: 'UPDATE_CACHE_STATUS',
        payload: { lastSync: new Date(), needsRefresh: false },
      });
    } catch (error) {
      console.error('Background sync failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Background sync failed' });
    } finally {
      syncTimeoutRef.current = null;
    }
  }, [dispatch, googleCalendarService]);

  const loadCacheInstantly = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Load from cache INSTANTLY for immediate UI
      const cachedEvents = calendarCache.getAllEvents();
      const cachedCalendars = calendarCache.getAllCalendars();

      console.log(
        `📱 INSTANT LOAD: ${cachedEvents.length} events, ${cachedCalendars.length} calendars`,
      );

      dispatch({
        type: 'LOAD_FROM_CACHE',
        payload: { events: cachedEvents, calendars: cachedCalendars },
      });

      // Start background refresh if needed
      if (calendarCache.needsRefresh()) {
        console.log('🔄 Starting background sync...');
        startBackgroundSync();
      }
    } catch (error) {
      console.error('Cache load error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load calendar cache' });
    }
  }, [dispatch, startBackgroundSync]);

  return {
    startBackgroundSync,
    loadCacheInstantly,
    syncTimeoutRef,
  };
};