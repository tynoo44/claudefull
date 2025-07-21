import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Star,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Settings,
  MoreHorizontal,
  Clock,
  MapPin,
  Video,
  Phone,
  Bell,
  Share2,
  Edit3,
  Trash2,
  Copy,
  Move,
  Archive,
  Tag,
  Grid3X3,
  List,
  LayoutGrid,
  Sidebar,
  Maximize2,
  Download,
  RefreshCw,
  Sun,
  Moon,
  Palette,
  User,
  Globe,
  Shield,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  getWeek,
  isSameWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { GoogleCalendarService } from '../lib/google-calendar';
import { MonthView } from '../components/Calendar/Premium/MonthView';
import { WeekView } from '../components/Calendar/Premium/WeekView';
import { DayView } from '../components/Calendar/Premium/DayView';
import { AgendaView } from '../components/Calendar/Premium/AgendaView';
import { EventDetailModal } from '../components/Calendar/Premium/EventDetailModal';
import { EventCreateModal } from '../components/Calendar/Premium/EventCreateModal';

interface PremiumCalendarAdvancedProps {
  darkMode: boolean;
}

type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'year';
type TimeFormat = '12h' | '24h';

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
    avatar?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
  }>;
  type: 'meeting' | 'event' | 'reminder' | 'task';
  isRecurring?: boolean;
  isAllDay?: boolean;
  meetingLink?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface CalendarSettings {
  timeFormat: TimeFormat;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  showWeekends: boolean;
  showDeclinedEvents: boolean;
  showAllDayEvents: boolean;
  defaultEventDuration: number; // minutes
  notifications: boolean;
  compactView: boolean;
}

export const PremiumCalendarAdvanced: React.FC<PremiumCalendarAdvancedProps> = ({ darkMode }) => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState<{ date?: Date; hour?: number }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<
    Array<{ id: string; name: string; color: string; visible: boolean }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<CalendarSettings>({
    timeFormat: '24h',
    weekStartsOn: 1,
    showWeekends: true,
    showDeclinedEvents: false,
    showAllDayEvents: true,
    defaultEventDuration: 60,
    notifications: true,
    compactView: false,
  });

  const { user } = useAuth();

  // No sample events - will load from Google Calendar only
  const sampleEvents: CalendarEvent[] = useMemo(() => [], []);

  const sampleCalendars = useMemo(() => {
    const defaultCalendars = [
      { id: 'work', name: 'Trabajo', color: '#3b82f6', visible: true },
      { id: 'personal', name: 'Personal', color: '#f59e0b', visible: true },
      { id: 'business', name: 'Negocios', color: '#10b981', visible: true },
      { id: 'events', name: 'Eventos', color: '#8b5cf6', visible: true },
    ];

    // Load visibility preferences from localStorage
    const savedVisibility = localStorage.getItem('calendar-visibility');
    if (savedVisibility) {
      try {
        const visibilityMap = JSON.parse(savedVisibility);
        return defaultCalendars.map(cal => ({
          ...cal,
          visible: visibilityMap[cal.id] !== undefined ? visibilityMap[cal.id] : cal.visible,
        }));
      } catch (error) {
        console.error('Error parsing saved calendar visibility:', error);
      }
    }

    return defaultCalendars;
  }, []);

  // Initialize data
  useEffect(() => {
    console.log('Initializing data...');
    console.log('Sample events:', sampleEvents.length);
    console.log('Sample calendars:', sampleCalendars);
    setEvents(sampleEvents);
    setCalendars(sampleCalendars);
  }, [sampleEvents, sampleCalendars]);

  // Load Google Calendar data
  const loadGoogleCalendarData = useCallback(async () => {
    if (!user) {
      console.log('No user authenticated, using sample data only');
      return;
    }

    setIsLoading(true);
    try {
      const calendarService = new GoogleCalendarService();

      // Check if user has Google access
      const hasAccess = await calendarService.hasGoogleAccess();
      if (!hasAccess) {
        console.log('User needs to re-authenticate with Google Calendar');
        // Continue with sample data
        return;
      }

      const googleCalendars = await calendarService.getUserCalendars();

      // Convert Google calendars to our format with saved visibility
      const savedVisibility = localStorage.getItem('calendar-visibility');
      let visibilityMap: Record<string, boolean> = {};
      if (savedVisibility) {
        try {
          visibilityMap = JSON.parse(savedVisibility);
        } catch (error) {
          console.error('Error parsing saved calendar visibility:', error);
        }
      }

      const formattedCalendars = googleCalendars.map(cal => {
        const calendarId = cal.google_calendar_id || cal.id;
        return {
          id: calendarId,
          name: cal.name,
          color: cal.color_id ? `#${cal.color_id}` : '#3b82f6',
          visible: visibilityMap[calendarId] !== undefined ? visibilityMap[calendarId] : true,
        };
      });

      setCalendars([...sampleCalendars, ...formattedCalendars]);

      // Load events for visible calendars
      const allEvents: CalendarEvent[] = [];
      for (const calendar of googleCalendars) {
        try {
          const calendarEvents = await calendarService.getEvents(
            calendar.google_calendar_id || calendar.id,
          );
          const formattedEvents = calendarEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: new Date(event.start_datetime),
            end: new Date(event.end_datetime),
            color: calendar.color_id ? `#${calendar.color_id}` : '#3b82f6',
            calendarId: calendar.google_calendar_id || calendar.id,
            calendarName: calendar.name,
            description: event.description,
            location: event.location,
            type: 'meeting' as const,
            priority: 'medium' as const,
            isAllDay: event.is_all_day,
            meetingLink: event.meeting_link,
            attendees: event.attendees?.map(att => ({
              email: att.email,
              name: att.display_name,
              status: 'pending' as const,
            })),
          }));
          allEvents.push(...formattedEvents);
        } catch (eventError) {
          console.error(`Error loading events for calendar ${calendar.name}:`, eventError);
          // Continue with other calendars
        }
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading Google Calendar:', error);
      // Continue with sample data if Google Calendar fails
    } finally {
      setIsLoading(false);
    }
  }, [user, sampleEvents, sampleCalendars]);

  // Load data on mount
  useEffect(() => {
    loadGoogleCalendarData();
  }, [loadGoogleCalendarData]);

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    switch (currentView) {
      case 'month':
        setCurrentDate(
          direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1),
        );
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(
          direction === 'next' ? addMonths(currentDate, 12) : subMonths(currentDate, 12),
        );
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    console.log('=== FILTERING EVENTS ===');
    console.log('Total events available:', events.length);
    console.log('Calendars state:', calendars);

    if (events.length === 0) {
      console.log('No events to filter');
      return [];
    }

    const filtered = events.filter(event => {
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      console.log(`Event: ${event.title}`);
      console.log(`  - Event calendarId: ${event.calendarId}`);
      console.log(`  - Calendar found: ${!!calendar}`);
      console.log(`  - Calendar visible: ${calendar?.visible}`);

      if (!calendar) {
        console.log(`  - NO CALENDAR FOUND for ${event.calendarId}`);
        return false;
      }

      if (!calendar.visible) {
        console.log(`  - CALENDAR NOT VISIBLE`);
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query);
        console.log(`  - Search matches: ${matches}`);
        return matches;
      }

      console.log(`  - EVENT PASSED FILTER`);
      return true;
    });

    console.log('Filtered events count:', filtered.length);
    console.log(
      'Filtered events:',
      filtered.map(e => e.title),
    );
    return filtered;
  }, [events, calendars, searchQuery]);

  // Get current date range label
  const getDateRangeLabel = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: es });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: settings.weekStartsOn });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: settings.weekStartsOn });
        return `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy', { locale: es })}`;
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: es });
      case 'year':
        return format(currentDate, 'yyyy');
      case 'agenda':
        return 'Próximos eventos';
      default:
        return '';
    }
  };

  // Event handlers
  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
    setShowCreateModal(false);
    setCreateModalData({});
  };

  const handleEventUpdated = (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(event => (event.id === updatedEvent.id ? updatedEvent : event)));
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(false);
    setCreateModalData({ date: event.start });
    setShowCreateModal(true);
  };

  // Render top toolbar
  const renderToolbar = () => (
    <div
      className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          <Sidebar className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Calendar
          </h1>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            PRO
          </span>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            type="text"
            placeholder="Buscar eventos, personas, lugares..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2">
        <button
          onClick={loadGoogleCalendarData}
          disabled={isLoading}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          } ${isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>

        <button
          onClick={() => {
            setCreateModalData({ date: selectedDate || new Date() });
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Crear</span>
        </button>
      </div>
    </div>
  );

  // Render navigation bar
  const renderNavigation = () => (
    <div
      className={`flex items-center justify-between p-4 border-b ${
        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Date navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={goToToday}
          className={`px-3 py-1 rounded-lg border ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          } text-sm font-medium`}
        >
          Hoy
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateDate('prev')}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2
            className={`text-lg font-semibold min-w-[200px] text-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {getDateRangeLabel()}
          </h2>

          <button
            onClick={() => navigateDate('next')}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* View selector */}
      <div
        className={`flex items-center space-x-1 p-1 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        {[
          { key: 'month', label: 'Mes', icon: Grid3X3 },
          { key: 'week', label: 'Semana', icon: LayoutGrid },
          { key: 'day', label: 'Día', icon: Calendar },
          { key: 'agenda', label: 'Agenda', icon: List },
        ].map(view => {
          const Icon = view.icon;
          return (
            <button
              key={view.key}
              onClick={() => setCurrentView(view.key as ViewType)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === view.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render sidebar
  const renderSidebar = () => {
    if (!showSidebar) return null;

    return (
      <div
        className={`w-64 border-r ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } p-4 space-y-4`}
      >
        {/* Mini calendar */}
        <div>
          <h3
            className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
          >
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
              <div
                key={day}
                className={`text-center p-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {day}
              </div>
            ))}
            {eachDayOfInterval({
              start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
              end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
            }).map(day => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-1 text-center rounded hover:bg-blue-100 dark:hover:bg-blue-900 ${
                  isToday(day)
                    ? 'bg-blue-600 text-white'
                    : isSameMonth(day, currentDate)
                      ? darkMode
                        ? 'text-gray-200'
                        : 'text-gray-900'
                      : darkMode
                        ? 'text-gray-600'
                        : 'text-gray-400'
                } ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}`}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>
        </div>

        {/* Calendars list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Mis calendarios
            </h3>
            <button
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {calendars.map(calendar => (
              <div key={calendar.id} className="flex items-center space-x-3 group">
                <button
                  onClick={() => {
                    const updatedCalendars = calendars.map(cal =>
                      cal.id === calendar.id ? { ...cal, visible: !cal.visible } : cal,
                    );
                    setCalendars(updatedCalendars);

                    // Save visibility preferences to localStorage
                    const visibilityMap = updatedCalendars.reduce(
                      (acc, cal) => {
                        acc[cal.id] = cal.visible;
                        return acc;
                      },
                      {} as Record<string, boolean>,
                    );
                    localStorage.setItem('calendar-visibility', JSON.stringify(visibilityMap));
                  }}
                  className="flex-shrink-0"
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      calendar.visible ? '' : 'bg-transparent'
                    }`}
                    style={{
                      backgroundColor: calendar.visible ? calendar.color : 'transparent',
                      borderColor: calendar.color,
                    }}
                  />
                </button>
                <span
                  className={`flex-1 text-sm ${
                    calendar.visible
                      ? darkMode
                        ? 'text-gray-200'
                        : 'text-gray-900'
                      : darkMode
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  }`}
                >
                  {calendar.name}
                </span>
                <button
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h4
            className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            ESTADÍSTICAS
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Eventos hoy</span>
              <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>
                {filteredEvents.filter(event => isToday(event.start)).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Esta semana</span>
              <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>
                {filteredEvents.filter(event => isSameWeek(event.start, new Date())).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {renderToolbar()}
      {renderNavigation()}

      <div className="flex flex-1 overflow-hidden">
        {renderSidebar()}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} p-4`}>
            {currentView === 'month' ? (
              <div className="h-full overflow-hidden">
                <MonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={calendars}
                  selectedDate={selectedDate}
                  selectedEvent={selectedEvent}
                  hoveredEvent={hoveredEvent}
                  onDateClick={setSelectedDate}
                  onEventClick={event => {
                    console.log('Event clicked:', event);
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  onEventHover={setHoveredEvent}
                  onTimeSlotClick={date => {
                    setSelectedDate(date);
                    setCreateModalData({ date });
                    setShowCreateModal(true);
                  }}
                  darkMode={darkMode}
                  compactView={settings.compactView}
                />
              </div>
            ) : currentView === 'week' ? (
              <div className="h-full overflow-hidden">
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={calendars}
                  selectedDate={selectedDate}
                  selectedEvent={selectedEvent}
                  hoveredEvent={hoveredEvent}
                  onDateClick={setSelectedDate}
                  onEventClick={event => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  onEventHover={setHoveredEvent}
                  onTimeSlotClick={(date, hour) => {
                    setSelectedDate(date);
                    setCreateModalData({ date, hour });
                    setShowCreateModal(true);
                  }}
                  darkMode={darkMode}
                  compactView={settings.compactView}
                />
              </div>
            ) : currentView === 'day' ? (
              <div className="h-full overflow-hidden">
                <DayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={calendars}
                  selectedEvent={selectedEvent}
                  hoveredEvent={hoveredEvent}
                  onEventClick={event => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  onEventHover={setHoveredEvent}
                  onTimeSlotClick={(date, hour) => {
                    setSelectedDate(date);
                    setCreateModalData({ date, hour });
                    setShowCreateModal(true);
                  }}
                  darkMode={darkMode}
                  compactView={settings.compactView}
                />
              </div>
            ) : currentView === 'agenda' ? (
              <div className="h-full overflow-hidden">
                <AgendaView
                  currentDate={currentDate}
                  events={filteredEvents}
                  calendars={calendars}
                  selectedEvent={selectedEvent}
                  hoveredEvent={hoveredEvent}
                  onEventClick={event => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  onEventHover={setHoveredEvent}
                  onTimeSlotClick={(date, hour) => {
                    setSelectedDate(date);
                    setCreateModalData({ date, hour });
                    setShowCreateModal(true);
                  }}
                  darkMode={darkMode}
                  compactView={settings.compactView}
                />
              </div>
            ) : (
              <div className="text-center py-20">
                <Calendar
                  className={`h-24 w-24 mx-auto mb-6 ${
                    darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                />
                <h3
                  className={`text-2xl font-semibold mb-2 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  Vista {currentView} próximamente
                </h3>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Estamos trabajando en esta vista...
                </p>

                {isLoading && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Cargando Google Calendar...
                    </span>
                  </div>
                )}

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: Zap, label: 'Rápido', desc: 'Carga instantánea' },
                    { icon: Users, label: 'Colaborativo', desc: 'Trabajo en equipo' },
                    { icon: Shield, label: 'Seguro', desc: 'Datos protegidos' },
                    { icon: Globe, label: 'Sincronizado', desc: 'Multi-dispositivo' },
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Icon
                          className={`h-8 w-8 mx-auto mb-2 ${
                            [
                              'text-blue-500',
                              'text-green-500',
                              'text-purple-500',
                              'text-orange-500',
                            ][index]
                          }`}
                        />
                        <h4
                          className={`font-semibold text-sm ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}
                        >
                          {feature.label}
                        </h4>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {feature.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status bar - Fixed at bottom */}
          <div
            className={`shrink-0 p-3 border-t ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            } flex items-center justify-between text-xs min-h-[48px]`}
          >
            <div className="flex items-center space-x-4">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {filteredEvents.length} eventos cargados
              </span>
              {searchQuery && (
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Filtrado por: "{searchQuery}"
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}
              />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {isLoading ? 'Sincronizando...' : 'Sincronizado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && showEventModal && (
        <EventDetailModal
          event={selectedEvent}
          calendars={calendars}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onEdit={handleEditEvent}
          onDelete={handleEventDeleted}
          onDuplicate={event => {
            console.log('Duplicate event:', event);
            // TODO: Implement duplicate functionality
          }}
          darkMode={darkMode}
        />
      )}

      {/* Event Create/Edit Modal */}
      <EventCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateModalData({});
          setSelectedEvent(null);
        }}
        calendars={calendars}
        selectedDate={createModalData.date}
        selectedHour={createModalData.hour}
        existingEvent={selectedEvent}
        darkMode={darkMode}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};
