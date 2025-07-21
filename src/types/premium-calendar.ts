// Premium Calendar Type Definitions
// Extends existing calendar types with advanced features

import type { CalendarEvent, GoogleCalendar, EventAttendee } from './calendar';

// =============================================================================
// CORE PREMIUM TYPES
// =============================================================================

export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | '3-day' | 'year';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ViewportRange {
  startIndex: number;
  endIndex: number;
  startDate: Date;
  endDate: Date;
}

// =============================================================================
// DRAG & DROP TYPES
// =============================================================================

export interface DragState {
  isDragging: boolean;
  draggedEvent: CalendarEvent | null;
  dragStart: { x: number; y: number; date: Date };
  dragCurrent: { x: number; y: number; date: Date };
  dragType: 'move' | 'resize-start' | 'resize-end' | 'create';
}

export interface DropTarget {
  calendarId: string;
  date: Date;
  timeSlot?: { start: Date; end: Date };
  isValid: boolean;
  conflictEvents?: CalendarEvent[];
}

export interface DragPreview {
  event: CalendarEvent;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
}

export interface DragResult {
  success: boolean;
  updatedEvent?: CalendarEvent;
  conflicts?: ConflictResult[];
  error?: string;
}

// =============================================================================
// MULTI-CALENDAR TYPES
// =============================================================================

export interface CalendarSettings {
  id: string;
  isVisible: boolean;
  color: string;
  opacity: number;
  zIndex: number;
  notifications: boolean;
  syncEnabled: boolean;
}

export interface CalendarGroup {
  id: string;
  name: string;
  calendarIds: string[];
  color: string;
  isCollapsed: boolean;
}

export interface CalendarOverlaySettings {
  mode: 'merge' | 'separate' | 'priority';
  colorScheme: 'auto' | 'custom';
  showConflicts: boolean;
  conflictResolution: 'highlight' | 'stack' | 'transparent';
}

export interface MultiCalendarState {
  selectedCalendars: Set<string>;
  calendarSettings: Map<string, CalendarSettings>;
  calendarGroups: CalendarGroup[];
  overlaySettings: CalendarOverlaySettings;
  activeFilters: EventFilters;
}

// =============================================================================
// EVENT ENHANCEMENT TYPES
// =============================================================================

export interface EventTemplate {
  id: string;
  name: string;
  category: string;
  title: string;
  description?: string;
  duration: number; // minutes
  location?: string;
  attendees?: Omit<EventAttendee, 'response_status'>[];
  reminders?: EventReminder[];
  recurrence?: RecurrenceTemplate;
  color?: string;
  tags?: string[];
  isPublic: boolean;
  userId: string;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceTemplate {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: string;
  byWeekday?: number[];
  byMonthday?: number[];
  exceptions?: string[]; // ISO date strings
}

export interface EventReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

export interface EventConflict {
  eventId: string;
  conflictingEventId: string;
  type: 'time_overlap' | 'location_conflict' | 'resource_conflict';
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface ConflictResult {
  conflicts: EventConflict[];
  canProceed: boolean;
  suggestions: ConflictSuggestion[];
}

export interface ConflictSuggestion {
  type: 'reschedule' | 'modify_duration' | 'change_location' | 'remove_attendee';
  description: string;
  proposedChanges: Partial<CalendarEvent>;
  confidence: number; // 0-1
}

// =============================================================================
// CONTACT INTEGRATION TYPES
// =============================================================================

export interface ContactInfo {
  email: string;
  name?: string;
  photoUrl?: string;
  organization?: string;
  title?: string;
  phoneNumbers?: string[];
  addresses?: ContactAddress[];
  isFrequent: boolean;
  lastInteraction?: string;
}

export interface ContactAddress {
  type: 'work' | 'home' | 'other';
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ContactSuggestion {
  contact: ContactInfo;
  relevanceScore: number;
  reason: string; // Why this contact is suggested
}

export interface AttendeeWithContact extends EventAttendee {
  contactInfo?: ContactInfo;
  availability?: AttendeeAvailability;
}

export interface AttendeeAvailability {
  status: 'free' | 'busy' | 'tentative' | 'out_of_office' | 'unknown';
  nextAvailable?: Date;
  busyUntil?: Date;
}

// =============================================================================
// PERFORMANCE & VIRTUALIZATION TYPES
// =============================================================================

export interface VirtualizationSettings {
  enabled: boolean;
  overscan: number;
  estimatedCellHeight: number;
  maxCacheSize: number;
  preloadBuffer: number; // days
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in ms
  key: string;
}

export interface EventCacheKey {
  calendarIds: string[];
  dateRange: DateRange;
  filters?: EventFilters;
}

export interface PerformanceMetrics {
  renderTime: number;
  eventCount: number;
  cacheHitRate: number;
  memoryUsage: number;
  scrollPerformance: number; // fps
}

// =============================================================================
// FILTERING & SEARCH TYPES
// =============================================================================

export interface EventFilters {
  searchQuery?: string;
  calendarIds?: string[];
  attendees?: string[];
  tags?: string[];
  status?: ('confirmed' | 'tentative' | 'cancelled')[];
  eventTypes?: EventType[];
  dateRange?: DateRange;
  hasLocation?: boolean;
  hasAttendees?: boolean;
  isRecurring?: boolean;
  priority?: ('low' | 'medium' | 'high')[];
}

export interface EventType {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface SearchResult {
  events: CalendarEvent[];
  totalCount: number;
  facets: SearchFacets;
  suggestions: string[];
}

export interface SearchFacets {
  calendars: { id: string; name: string; count: number }[];
  attendees: { email: string; name: string; count: number }[];
  locations: { name: string; count: number }[];
  tags: { name: string; count: number }[];
}

// =============================================================================
// ANALYTICS & INSIGHTS TYPES
// =============================================================================

export interface UsageMetrics {
  totalEvents: number;
  eventsPerDay: number;
  averageMeetingDuration: number;
  busyHours: { hour: number; eventCount: number }[];
  topCalendars: { calendarId: string; eventCount: number }[];
  topAttendees: { email: string; meetingCount: number }[];
  productivityScore: number; // 0-100
  dateRange: DateRange;
}

export interface ProductivityMetrics {
  focusTime: number; // minutes per day
  meetingTime: number; // minutes per day
  fragmentedTime: number; // minutes in gaps < 30min
  optimalMeetingRatio: number; // 0-1, ideal is ~0.5
  calendarEfficiency: number; // 0-1
  suggestions: ProductivitySuggestion[];
}

export interface ProductivitySuggestion {
  type: 'schedule_focus_time' | 'reduce_meetings' | 'batch_meetings' | 'add_breaks';
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface MeetingPatterns {
  averageDuration: number;
  commonTimeSlots: { start: string; end: string; frequency: number }[];
  meetingTypes: { type: string; count: number; avgDuration: number }[];
  attendeePatterns: { size: number; frequency: number }[];
  recurringVsOneTime: { recurring: number; oneTime: number };
}

// =============================================================================
// COLLABORATION & SHARING TYPES
// =============================================================================

export interface CalendarShareSettings {
  calendarId: string;
  isPublic: boolean;
  publicUrl?: string;
  embedSettings?: EmbedSettings;
  sharePermissions: SharePermission[];
  allowAnonymousView: boolean;
  requireAuth: boolean;
}

export interface SharePermission {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  canInviteOthers: boolean;
  canModifyPermissions: boolean;
  expiresAt?: string;
}

export interface EmbedSettings {
  width: number;
  height: number;
  showTitle: boolean;
  showNavigation: boolean;
  defaultView: CalendarView;
  theme: 'light' | 'dark' | 'auto';
  allowedDomains?: string[];
}

export interface RealTimeUpdate {
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'calendar_updated';
  calendarId: string;
  eventId?: string;
  data: unknown;
  userId: string;
  timestamp: string;
}

export interface UserPresence {
  userId: string;
  email: string;
  name?: string;
  photoUrl?: string;
  isOnline: boolean;
  lastSeen: string;
  currentCalendar?: string;
  isEditing?: string; // eventId being edited
}

// =============================================================================
// AI & SMART FEATURES TYPES
// =============================================================================

export interface SmartSchedulingRequest {
  title: string;
  duration: number; // minutes
  attendees: string[];
  preferredTimeSlots?: TimeSlot[];
  avoidTimeSlots?: TimeSlot[];
  location?: string;
  isOnline?: boolean;
  priority: 'low' | 'medium' | 'high';
  buffer?: number; // minutes before/after
}

export interface TimeSlot {
  start: Date;
  end: Date;
  weight?: number; // preference weight 0-1
}

export interface SmartSchedulingSuggestion {
  timeSlot: TimeSlot;
  confidence: number;
  reasoning: string[];
  conflicts: EventConflict[];
  travelTime?: number;
  attendeeAvailability: Map<string, AttendeeAvailability>;
}

export interface EventInsight {
  eventId: string;
  insights: {
    optimalDuration?: number;
    suggestedAttendees?: string[];
    betterTimeSlots?: TimeSlot[];
    locationSuggestions?: string[];
    preparationTime?: number;
  };
  confidence: number;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface CalendarUIState {
  currentView: CalendarView;
  currentDate: Date;
  selectedEvents: Set<string>;
  hoveredEvent?: string;
  detailPanelOpen: boolean;
  detailPanelEventId?: string;
  sidebarOpen: boolean;
  sidebarTab: 'calendars' | 'upcoming' | 'search' | 'analytics';
  isLoading: boolean;
  error?: string;
  toast?: ToastMessage;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// =============================================================================
// PREMIUM CALENDAR CONTEXT TYPE
// =============================================================================

export interface PremiumCalendarContextType {
  // State
  uiState: CalendarUIState;
  multiCalendarState: MultiCalendarState;
  dragState: DragState | null;

  // Data
  calendars: Map<string, GoogleCalendar>;
  events: Map<string, CalendarEvent>;
  eventTemplates: EventTemplate[];
  contacts: Map<string, ContactInfo>;

  // Performance
  viewportEvents: Set<string>;
  loadedDateRange: DateRange;
  metrics: PerformanceMetrics;

  // Actions
  setView: (view: CalendarView) => void;
  navigateDate: (direction: 'prev' | 'next' | Date) => void;
  selectEvent: (eventId: string, multi?: boolean) => void;
  toggleCalendar: (calendarId: string) => void;
  updateCalendarSettings: (calendarId: string, settings: Partial<CalendarSettings>) => void;

  // Event operations
  createEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  duplicateEvent: (eventId: string) => Promise<CalendarEvent>;

  // Drag & drop
  startDrag: (event: CalendarEvent, dragType: DragState['dragType']) => void;
  updateDrag: (position: { x: number; y: number; date: Date }) => void;
  completeDrag: (dropTarget: DropTarget) => Promise<DragResult>;
  cancelDrag: () => void;

  // Search & filter
  searchEvents: (query: string, filters?: EventFilters) => Promise<SearchResult>;
  applyFilters: (filters: EventFilters) => void;
  clearFilters: () => void;

  // Analytics
  getUsageMetrics: (dateRange: DateRange) => Promise<UsageMetrics>;
  getProductivityInsights: () => Promise<ProductivityMetrics>;

  // Smart features
  suggestScheduling: (request: SmartSchedulingRequest) => Promise<SmartSchedulingSuggestion[]>;
  getEventInsights: (eventId: string) => Promise<EventInsight>;

  // Real-time
  subscribeToUpdates: (calendarIds: string[]) => () => void;
  broadcastUpdate: (update: RealTimeUpdate) => void;
}
