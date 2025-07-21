import React, { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { AgendaViewItem } from './AgendaViewItem';
import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';
import type { MultiCalendarState } from '../../../../../types/premium-calendar';

interface AgendaViewListProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  hoveredEvent: string | null;
  calendars: GoogleCalendar[];
  multiCalendarSettings: MultiCalendarState;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onEventHover: (eventId: string | null) => void;
  isLoading?: boolean;
}

interface GroupedEvents {
  [dateKey: string]: {
    date: Date;
    events: CalendarEvent[];
    isExpanded: boolean;
  };
}

export const AgendaViewList: React.FC<AgendaViewListProps> = ({
  currentDate,
  events,
  selectedEvents,
  hoveredEvent,
  calendars,
  multiCalendarSettings,
  onEventClick,
  onDateClick,
  onEventHover,
  isLoading = false
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'calendar' | 'priority'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'tentative'>('all');

  // Calculate date range (show current week + next 2 weeks)
  const dateRange = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const extendedEnd = new Date(weekEnd);
    extendedEnd.setDate(extendedEnd.getDate() + 14); // Add 2 more weeks
    
    return {
      start: weekStart,
      end: extendedEnd
    };
  }, [currentDate]);

  // Get calendar color mapping
  const calendarColors = useMemo(() => {
    const colors = new Map<string, string>();
    calendars.forEach(calendar => {
      const colorId = calendar.color_id || '1';
      const colorMap = {
        '1': '#3b82f6', // blue
        '2': '#ef4444', // red  
        '3': '#f59e0b', // amber
        '4': '#10b981', // emerald
        '5': '#8b5cf6', // violet
        '6': '#f97316', // orange
        '7': '#06b6d4', // cyan
        '8': '#84cc16', // lime
        '9': '#ec4899', // pink
        '10': '#6b7280', // gray
      };
      colors.set(calendar.id, colorMap[colorId as keyof typeof colorMap] || '#3b82f6');
    });
    return colors;
  }, [calendars]);

  // Filter and group events
  const groupedEvents = useMemo((): GroupedEvents => {
    // Filter events by date range and status
    let filteredEvents = events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      const isInRange = eventDate >= dateRange.start && eventDate <= dateRange.end;
      const statusMatch = filterStatus === 'all' || event.status === filterStatus;
      return isInRange && statusMatch;
    });

    // Sort events
    filteredEvents.sort((a, b) => {
      const dateA = new Date(a.start_datetime);
      const dateB = new Date(b.start_datetime);
      
      switch (sortBy) {
        case 'calendar':
          const calendarCompare = a.google_calendar_id.localeCompare(b.google_calendar_id);
          return calendarCompare !== 0 ? calendarCompare : dateA.getTime() - dateB.getTime();
        case 'priority':
          // Priority based on status and attendee count
          const getPriority = (event: CalendarEvent) => {
            if (event.status === 'cancelled') return 3;
            if (event.status === 'tentative') return 2;
            return event.attendees?.length || 0 > 0 ? 0 : 1;
          };
          const priorityCompare = getPriority(a) - getPriority(b);
          return priorityCompare !== 0 ? priorityCompare : dateA.getTime() - dateB.getTime();
        default: // date
          return dateA.getTime() - dateB.getTime();
      }
    });

    // Group by date
    const grouped: GroupedEvents = {};
    
    // Create entries for all days in range, even if no events
    const allDays = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    allDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      grouped[dateKey] = {
        date: day,
        events: [],
        isExpanded: expandedDays.has(dateKey) || isToday(day)
      };
    });

    // Add events to their respective days
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.start_datetime);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      
      if (grouped[dateKey]) {
        grouped[dateKey].events.push(event);
      }
    });

    return grouped;
  }, [events, dateRange, sortBy, filterStatus, expandedDays]);

  const toggleDayExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDays(newExpanded);
  };

  const getTotalEventsCount = () => {
    return Object.values(groupedEvents).reduce((total, day) => total + day.events.length, 0);
  };

  const getDayDisplayClasses = (date: Date, hasEvents: boolean) => {
    let classes = "flex items-center justify-between p-3 cursor-pointer transition-colors rounded-lg";
    
    if (isToday(date)) {
      classes += " bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700";
    } else if (hasEvents) {
      classes += " hover:bg-gray-50 dark:hover:bg-gray-700";
    } else {
      classes += " opacity-60 hover:bg-gray-50 dark:hover:bg-gray-700";
    }
    
    return classes;
  };

  return (
    <div className="agenda-view h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Vista Agenda
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(dateRange.start, 'dd MMM', { locale: es })} - {format(dateRange.end, 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {getTotalEventsCount()} eventos
            </span>
          </div>
        </div>

        {/* Filters and sorting */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="date">Por fecha</option>
              <option value="calendar">Por calendario</option>
              <option value="priority">Por prioridad</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmados</option>
            <option value="tentative">Tentativa</option>
          </select>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando eventos...</span>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              No hay eventos
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              No se encontraron eventos en el rango de fechas seleccionado
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {Object.entries(groupedEvents).map(([dateKey, dayData]) => {
              const hasEvents = dayData.events.length > 0;
              const isExpanded = dayData.isExpanded;
              
              return (
                <div key={dateKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Day header */}
                  <div 
                    className={getDayDisplayClasses(dayData.date, hasEvents)}
                    onClick={() => {
                      if (hasEvents) {
                        toggleDayExpansion(dateKey);
                      } else {
                        onDateClick(dayData.date);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`text-lg font-semibold ${
                        isToday(dayData.date) 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {format(dayData.date, 'd')}
                      </div>
                      <div>
                        <div className={`font-medium ${
                          isToday(dayData.date) 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {format(dayData.date, 'EEEE', { locale: es })}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(dayData.date, 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                      {isToday(dayData.date) && (
                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                          Hoy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {hasEvents ? `${dayData.events.length} evento${dayData.events.length !== 1 ? 's' : ''}` : 'Sin eventos'}
                      </span>
                      {hasEvents && (
                        <div className="text-gray-400 dark:text-gray-500">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Events for this day */}
                  {hasEvents && isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      {dayData.events.map(event => (
                        <AgendaViewItem
                          key={event.id}
                          event={event}
                          isSelected={selectedEvents.has(event.id)}
                          isHovered={hoveredEvent === event.id}
                          calendarColor={calendarColors.get(event.google_calendar_id) || '#3b82f6'}
                          calendar={calendars.find(c => c.id === event.google_calendar_id)}
                          onClick={onEventClick}
                          onHover={onEventHover}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};