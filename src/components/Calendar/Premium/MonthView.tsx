import React, { useMemo, useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isToday, isSameDay, 
  addHours, isWithinInterval, differenceInMinutes, startOfDay, endOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Plus, Clock, MapPin, Video, Users } from 'lucide-react';
import type { CalendarEvent } from '../../../types/calendar';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Array<{id: string, name: string, color: string, visible: boolean}>;
  selectedDate: Date | null;
  selectedEvent: CalendarEvent | null;
  hoveredEvent: string | null;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventHover: (eventId: string | null) => void;
  onTimeSlotClick: (date: Date, hour?: number) => void;
  darkMode: boolean;
  compactView?: boolean;
  showWeekNumbers?: boolean;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  calendars,
  selectedDate,
  selectedEvent,
  hoveredEvent,
  onDateClick,
  onEventClick,
  onEventHover,
  onTimeSlotClick,
  darkMode,
  compactView = false,
  showWeekNumbers = false
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Calculate month days including padding
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start, { weekStartsOn: 0 });
    const endWeek = endOfWeek(end, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: startWeek, end: endWeek });
  }, [currentDate]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    
    events.forEach(event => {
      // Only show events from visible calendars
      const calendar = calendars.find(cal => cal.id === event.google_calendar_id);
      if (!calendar?.visible) return;
      
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      // Handle multi-day events
      let currentDay = startOfDay(eventStart);
      const endDay = startOfDay(eventEnd);
      
      while (currentDay <= endDay) {
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const dayEvents = grouped.get(dateKey) || [];
        dayEvents.push(event);
        grouped.set(dateKey, dayEvents);
        currentDay = addHours(currentDay, 24);
      }
    });
    
    // Sort events by start time within each day
    grouped.forEach((dayEvents, key) => {
      dayEvents.sort((a, b) => {
        const startA = new Date(a.start_datetime).getTime();
        const startB = new Date(b.start_datetime).getTime();
        if (startA !== startB) return startA - startB;
        
        // If same start time, sort by duration (longer first)
        const durationA = differenceInMinutes(new Date(a.end_datetime), new Date(a.start_datetime));
        const durationB = differenceInMinutes(new Date(b.end_datetime), new Date(b.start_datetime));
        return durationB - durationA;
      });
      grouped.set(key, dayEvents);
    });
    
    return grouped;
  }, [events, calendars]);

  // Get calendar color
  const getCalendarColor = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    return calendar?.color || '#3b82f6';
  };

  // Render event preview
  const renderEventPreview = (event: CalendarEvent, isExpanded: boolean = false) => {
    const calendar = calendars.find(cal => cal.id === event.google_calendar_id);
    const color = getCalendarColor(event.google_calendar_id);
    const isHovered = hoveredEvent === event.id;
    const isSelected = selectedEvent?.id === event.id;
    
    const eventTime = event.is_all_day 
      ? 'Todo el día' 
      : format(new Date(event.start_datetime), 'HH:mm');
    
    // Determine event icon
    const getEventIcon = () => {
      if (event.meeting_link) return <Video className="h-3 w-3" />;
      if (event.location) return <MapPin className="h-3 w-3" />;
      if (event.attendees && event.attendees.length > 0) return <Users className="h-3 w-3" />;
      return <Clock className="h-3 w-3" />;
    };
    
    return (
      <div
        key={event.id}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
        onMouseEnter={() => onEventHover(event.id)}
        onMouseLeave={() => onEventHover(null)}
        className={`
          relative group cursor-pointer rounded px-1 py-0.5 mb-1 text-xs
          transition-all duration-200 overflow-hidden
          ${event.is_all_day ? 'font-medium' : ''}
          ${isHovered ? 'ring-2 ring-offset-1 transform scale-105 z-10' : ''}
          ${isSelected ? 'ring-2' : ''}
          ${darkMode ? 'ring-offset-gray-800' : 'ring-offset-white'}
        `}
        style={{
          backgroundColor: `${color}20`,
          borderLeft: `3px solid ${color}`,
          color: darkMode ? '#ffffff' : color,
          ringColor: color
        }}
      >
        <div className="flex items-center space-x-1">
          {!compactView && getEventIcon()}
          <span className="font-medium truncate flex-1">
            {!event.is_all_day && (
              <span className="opacity-75 mr-1">{eventTime}</span>
            )}
            {event.title}
          </span>
          {event.attendees && event.attendees.length > 0 && !compactView && (
            <span className="opacity-60 text-[10px]">
              {event.attendees.length}
            </span>
          )}
        </div>
        
        {/* Hover tooltip */}
        {isHovered && !isExpanded && (
          <div className={`
            absolute left-0 top-full mt-1 z-50 p-3 rounded-lg shadow-lg
            w-64 pointer-events-none
            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            border
          `}>
            <div className="space-y-2">
              <div className="font-semibold">{event.title}</div>
              <div className="text-xs opacity-75">
                {event.is_all_day ? 'Todo el día' : (
                  <>
                    {format(new Date(event.start_datetime), 'HH:mm')} - 
                    {format(new Date(event.end_datetime), 'HH:mm')}
                  </>
                )}
              </div>
              {event.location && (
                <div className="flex items-center space-x-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
              )}
              {calendar && (
                <div className="flex items-center space-x-1 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span>{calendar.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render day cell
  const renderDayCell = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDay.get(dateKey) || [];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isExpanded = expandedDate === dateKey;
    const today = isToday(day);
    
    // Limit visible events
    const maxVisibleEvents = compactView ? 2 : 3;
    const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, maxVisibleEvents);
    const hiddenCount = dayEvents.length - visibleEvents.length;
    
    return (
      <div
        key={dateKey}
        onClick={() => onDateClick(day)}
        className={`
          relative min-h-[80px] md:min-h-[100px] p-1 md:p-2 border cursor-pointer
          transition-all duration-200 group
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          ${!isCurrentMonth ? 'opacity-40' : ''}
          ${today ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          hover:bg-gray-50 dark:hover:bg-gray-800
        `}
      >
        {/* Day number */}
        <div className="flex items-start justify-between mb-1">
          <span className={`
            text-sm font-medium
            ${today ? 'text-blue-600 dark:text-blue-400' : ''}
            ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
          `}>
            {format(day, 'd')}
          </span>
          
          {/* Quick add button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTimeSlotClick(day);
            }}
            className={`
              opacity-0 group-hover:opacity-100 p-1 rounded
              transition-opacity duration-200
              ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
            `}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        
        {/* Events */}
        <div className="space-y-0.5">
          {visibleEvents.map(event => renderEventPreview(event, isExpanded))}
          
          {/* More events indicator */}
          {hiddenCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedDate(isExpanded ? null : dateKey);
              }}
              className={`
                w-full text-xs py-0.5 rounded text-center
                transition-colors duration-200
                ${darkMode 
                  ? 'text-gray-400 hover:bg-gray-700' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {isExpanded ? 'Mostrar menos' : `+${hiddenCount} más`}
            </button>
          )}
        </div>
        
        {/* Today indicator */}
        {today && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Week headers */}
      <div className={`grid grid-cols-7 gap-px mb-2 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div
            key={day}
            className={`
              text-center py-2 text-sm font-semibold
              ${darkMode ? 'text-gray-300' : 'text-gray-700'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Month grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {monthDays.map(day => renderDayCell(day))}
      </div>
      
      {/* Status bar */}
      <div className={`mt-2 p-2 text-xs flex items-center justify-between ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <div className="flex items-center space-x-4">
          <span>{events.filter(e => {
            const cal = calendars.find(c => c.id === e.google_calendar_id);
            return cal?.visible;
          }).length} eventos visibles</span>
          <span>Semana {format(currentDate, 'w')}</span>
        </div>
        <div className="flex items-center space-x-2">
          {calendars.filter(c => c.visible).map(calendar => (
            <div key={calendar.id} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: calendar.color }}
              />
              <span className="hidden md:inline">{calendar.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};