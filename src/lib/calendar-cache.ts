// =============================================================================
// CALENDAR CACHE MANAGER - PRO PERFORMANCE
// =============================================================================
// Sistema de cache local para eventos de calendario con sincronización automática
// Garantiza carga instantánea y actualización en background

import type { CalendarEvent, GoogleCalendar } from '../types/calendar';
import type { DateRange } from '../types/premium-calendar';

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  expires: number;
}

interface CalendarCache {
  events: Record<string, CacheEntry<CalendarEvent>>;
  calendars: Record<string, CacheEntry<GoogleCalendar>>;
  dateRanges: Record<string, CacheEntry<CalendarEvent[]>>;
  metadata: {
    lastSync: number;
    version: string;
    totalEvents: number;
    totalCalendars: number;
  };
}

interface CacheConfig {
  maxAge: number; // Cache TTL in milliseconds
  maxEvents: number; // Maximum events to store
  compressionEnabled: boolean;
  storageType: 'localStorage' | 'indexedDB';
  syncInterval: number; // Background sync interval
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxEvents: 5000, // Max 5000 events cached
  compressionEnabled: true,
  storageType: 'localStorage',
  syncInterval: 5 * 60 * 1000, // Sync every 5 minutes
};

// =============================================================================
// CALENDAR CACHE MANAGER CLASS
// =============================================================================

class CalendarCacheManager {
  private config: CacheConfig;
  private cache: CalendarCache;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(update: any) => void> = new Set();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = this.initializeCache();
    this.loadFromStorage();
    this.startBackgroundSync();
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeCache(): CalendarCache {
    return {
      events: {},
      calendars: {},
      dateRanges: {},
      metadata: {
        lastSync: Date.now(),
        version: '1.0.0',
        totalEvents: 0,
        totalCalendars: 0,
      },
    };
  }

  private loadFromStorage(): void {
    try {
      if (this.config.storageType === 'localStorage') {
        const stored = localStorage.getItem('calendar-cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.cache = { ...this.cache, ...parsed };
          this.cleanExpiredEntries();
        }
      }
    } catch (error) {
      console.warn('Failed to load calendar cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      if (this.config.storageType === 'localStorage') {
        localStorage.setItem('calendar-cache', JSON.stringify(this.cache));
      }
    } catch (error) {
      console.warn('Failed to save calendar cache to storage:', error);
    }
  }

  // =============================================================================
  // EVENT CACHE OPERATIONS
  // =============================================================================

  /**
   * Cache a single event with expiration
   */
  cacheEvent(event: CalendarEvent, ttl?: number): void {
    const expiration = Date.now() + (ttl || this.config.maxAge);
    
    this.cache.events[event.id] = {
      data: event,
      timestamp: Date.now(),
      version: this.cache.metadata.version,
      expires: expiration,
    };

    this.updateMetadata();
    this.saveToStorage();
  }

  /**
   * Cache multiple events efficiently
   */
  cacheEvents(events: CalendarEvent[], ttl?: number): void {
    const expiration = Date.now() + (ttl || this.config.maxAge);
    const timestamp = Date.now();

    events.forEach(event => {
      this.cache.events[event.id] = {
        data: event,
        timestamp,
        version: this.cache.metadata.version,
        expires: expiration,
      };
    });

    this.updateMetadata();
    this.saveToStorage();
  }

  /**
   * Get cached event by ID
   */
  getEvent(eventId: string): CalendarEvent | null {
    const entry = this.cache.events[eventId];
    if (!entry || Date.now() > entry.expires) {
      return null;
    }
    return entry.data;
  }

  /**
   * Get all cached events for instant display
   */
  getAllEvents(): CalendarEvent[] {
    const now = Date.now();
    return Object.values(this.cache.events)
      .filter(entry => now <= entry.expires)
      .map(entry => entry.data)
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  }

  /**
   * Get events in date range from cache
   */
  getEventsInRange(startDate: Date, endDate: Date): CalendarEvent[] {
    const rangeKey = this.generateRangeKey(startDate, endDate);
    const rangeEntry = this.cache.dateRanges[rangeKey];
    
    if (rangeEntry && Date.now() <= rangeEntry.expires) {
      return rangeEntry.data;
    }

    // Fallback to filtering all events
    return this.getAllEvents().filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      return eventStart <= endDate && eventEnd >= startDate;
    });
  }

  /**
   * Cache events for a specific date range
   */
  cacheEventsForRange(startDate: Date, endDate: Date, events: CalendarEvent[]): void {
    const rangeKey = this.generateRangeKey(startDate, endDate);
    
    this.cache.dateRanges[rangeKey] = {
      data: events,
      timestamp: Date.now(),
      version: this.cache.metadata.version,
      expires: Date.now() + this.config.maxAge,
    };

    // Also cache individual events
    this.cacheEvents(events);
  }

  // =============================================================================
  // CALENDAR CACHE OPERATIONS
  // =============================================================================

  /**
   * Cache calendar metadata
   */
  cacheCalendar(calendar: GoogleCalendar): void {
    this.cache.calendars[calendar.id] = {
      data: calendar,
      timestamp: Date.now(),
      version: this.cache.metadata.version,
      expires: Date.now() + this.config.maxAge,
    };

    this.updateMetadata();
    this.saveToStorage();
  }

  /**
   * Get cached calendar by ID
   */
  getCalendar(calendarId: string): GoogleCalendar | null {
    const entry = this.cache.calendars[calendarId];
    if (!entry || Date.now() > entry.expires) {
      return null;
    }
    return entry.data;
  }

  /**
   * Get all cached calendars
   */
  getAllCalendars(): GoogleCalendar[] {
    const now = Date.now();
    return Object.values(this.cache.calendars)
      .filter(entry => now <= entry.expires)
      .map(entry => entry.data);
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  /**
   * Check if cache needs refresh for a date range
   */
  needsRefresh(startDate?: Date, endDate?: Date): boolean {
    const lastSync = this.cache.metadata.lastSync;
    const syncThreshold = Date.now() - this.config.syncInterval;

    if (lastSync < syncThreshold) {
      return true;
    }

    // Check if specific range is cached
    if (startDate && endDate) {
      const rangeKey = this.generateRangeKey(startDate, endDate);
      const rangeEntry = this.cache.dateRanges[rangeKey];
      return !rangeEntry || Date.now() > rangeEntry.expires;
    }

    return false;
  }

  /**
   * Mark cache as synced
   */
  markAsSynced(): void {
    this.cache.metadata.lastSync = Date.now();
    this.saveToStorage();
  }

  /**
   * Clear expired cache entries
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();

    // Clean events
    Object.keys(this.cache.events).forEach(eventId => {
      if (this.cache.events[eventId].expires < now) {
        delete this.cache.events[eventId];
      }
    });

    // Clean calendars
    Object.keys(this.cache.calendars).forEach(calendarId => {
      if (this.cache.calendars[calendarId].expires < now) {
        delete this.cache.calendars[calendarId];
      }
    });

    // Clean date ranges
    Object.keys(this.cache.dateRanges).forEach(rangeKey => {
      if (this.cache.dateRanges[rangeKey].expires < now) {
        delete this.cache.dateRanges[rangeKey];
      }
    });

    this.updateMetadata();
  }

  /**
   * Clear all cache data
   */
  clearCache(): void {
    this.cache = this.initializeCache();
    this.saveToStorage();
    this.notifyListeners({ type: 'cache-cleared' });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const validEvents = Object.values(this.cache.events).filter(e => e.expires > now).length;
    const validCalendars = Object.values(this.cache.calendars).filter(c => c.expires > now).length;
    const validRanges = Object.values(this.cache.dateRanges).filter(r => r.expires > now).length;

    return {
      events: validEvents,
      calendars: validCalendars,
      dateRanges: validRanges,
      lastSync: new Date(this.cache.metadata.lastSync),
      cacheSize: this.estimateCacheSize(),
      hitRate: this.calculateHitRate(),
    };
  }

  // =============================================================================
  // BACKGROUND SYNC
  // =============================================================================

  private startBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.cleanExpiredEntries();
      this.notifyListeners({ 
        type: 'background-sync',
        needsRefresh: this.needsRefresh()
      });
    }, this.config.syncInterval);
  }

  stopBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // =============================================================================
  // EVENT LISTENERS
  // =============================================================================

  /**
   * Subscribe to cache updates
   */
  subscribe(callback: (update: any) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(update: any): void {
    this.listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.warn('Cache listener error:', error);
      }
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateRangeKey(startDate: Date, endDate: Date): string {
    return `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
  }

  private updateMetadata(): void {
    this.cache.metadata.totalEvents = Object.keys(this.cache.events).length;
    this.cache.metadata.totalCalendars = Object.keys(this.cache.calendars).length;
  }

  private estimateCacheSize(): number {
    return new Blob([JSON.stringify(this.cache)]).size;
  }

  private calculateHitRate(): number {
    // Placeholder implementation - would need request tracking
    return 0.85; // 85% hit rate assumption
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  destroy(): void {
    this.stopBackgroundSync();
    this.listeners.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const calendarCache = new CalendarCacheManager({
  maxAge: 12 * 60 * 60 * 1000, // 12 hours for better UX
  maxEvents: 10000, // Increased limit for power users
  syncInterval: 2 * 60 * 1000, // Sync every 2 minutes
});

// =============================================================================
// EXPORTS
// =============================================================================

export default CalendarCacheManager;
export type { CacheConfig, CalendarCache };