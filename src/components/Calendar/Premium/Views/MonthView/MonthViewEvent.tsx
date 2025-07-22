import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, Users, AlertTriangle, Move } from 'lucide-react';
import type { CalendarEvent } from '../../../../../types/calendar';

interface MonthViewEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  isHovered: boolean;
  calendarColor: string;
  onClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onHover: (eventId: string | null) => void;
  isDragDisabled?: boolean;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
}

export const MonthViewEvent: React.FC<MonthViewEventProps> = ({
  event,
  isSelected,
  isHovered,
  calendarColor,
  onClick,
  onHover,
  isDragDisabled = false,
}) => {
  const eventRef = useRef<HTMLDivElement>(null);
  const getStatusIcon = () => {
    switch (event.status) {
      case 'tentative':
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
      case 'cancelled':
        return <AlertTriangle className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };

  const getEventTypeIcon = () => {
    if (event.attendees && event.attendees.length > 0) {
      return <Users className="h-3 w-3" />;
    }
    if (event.location) {
      return <MapPin className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  const getTimeDisplay = () => {
    if (event.is_all_day) {
      return 'Todo el día';
    }

    const startTime = format(new Date(event.start_datetime), 'HH:mm');
    return startTime;
  };

  const getEventClasses = () => {
    const baseClasses =
      'group w-full text-left text-xs rounded p-1 mb-1 transition-all duration-200 relative overflow-hidden cursor-pointer';

    let classes = baseClasses;

    // Status-based styling
    if (event.status === 'cancelled') {
      classes += ' opacity-60 line-through';
    } else if (event.status === 'tentative') {
      classes += ' opacity-80 border-2 border-dashed';
    }

    // Selection and hover states
    if (isSelected) {
      classes += ' ring-2 ring-white ring-opacity-60 transform scale-105 z-10';
    }

    if (isHovered && !isSelected) {
      classes += ' transform scale-102 shadow-lg z-10';
    }

    // Visibility based on event importance
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const hasLocation = !!event.location;

    if (hasAttendees || hasLocation) {
      classes += ' border-l-4';
    }

    return classes;
  };

  const getBackgroundStyle = () => {
    let baseOpacity = isHovered || isSelected ? 0.9 : 0.8;
    let style: React.CSSProperties = {};

    if (event.status === 'cancelled') {
      return {
        ...style,
        backgroundColor: `${calendarColor}20`,
        color: calendarColor,
        borderLeftColor: calendarColor,
      };
    }

    if (event.status === 'tentative') {
      return {
        ...style,
        backgroundColor: `${calendarColor}30`,
        color: calendarColor,
        borderColor: calendarColor,
        borderLeftColor: calendarColor,
      };
    }

    return {
      ...style,
      backgroundColor: `${calendarColor}${Math.round(baseOpacity * 255)
        .toString(16)
        .padStart(2, '0')}`,
      color: 'white',
      borderLeftColor: calendarColor,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDragDisabled || e.button !== 0) return; // Only left click
    e.preventDefault();
  };

  const handleClick = (e: React.MouseEvent) => {
    onClick(event, e);
  };

  const handleMouseEnter = () => {
    onHover(event.id);
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  return (
    <div
      ref={eventRef}
      className={getEventClasses()}
      style={getBackgroundStyle()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${event.title}${event.description ? `\n${event.description}` : ''}${event.location ? `\n📍 ${event.location}` : ''}${
        !isDragDisabled ? '\n\n🖱️ Arrastra para mover' : ''
      }`}
    >
      {/* Event Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Event Title with Icon and Drag Handle */}
          <div className="flex items-center space-x-1 mb-1">
            {!isDragDisabled && (
              <div className="opacity-0 group-hover:opacity-60 transition-opacity">
                <Move className="h-2.5 w-2.5" />
              </div>
            )}
            {getEventTypeIcon()}
            <span className="font-medium truncate text-xs">{event.title}</span>
            {getStatusIcon()}
          </div>

          {/* Event Time */}
          <div className="flex items-center space-x-1 opacity-90">
            <Clock className="h-2.5 w-2.5" />
            <span className="text-xs">{getTimeDisplay()}</span>
          </div>

          {/* Location (if available and space permits) */}
          {event.location && (
            <div className="flex items-center space-x-1 opacity-75 mt-0.5">
              <MapPin className="h-2.5 w-2.5" />
              <span className="text-xs truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Attendee Count (if applicable) */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center ml-1 opacity-75">
            <Users className="h-3 w-3" />
            <span className="text-xs ml-0.5">{event.attendees.length}</span>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-white bg-opacity-20 pointer-events-none" />
      )}

      {/* Hover Enhancement */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-white bg-opacity-10 pointer-events-none" />
      )}
    </div>
  );
};
