import React from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, Users, AlertTriangle, MoreVertical } from 'lucide-react';
import type { CalendarEvent } from '../../../../../types/calendar';

interface WeekViewEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  isHovered: boolean;
  calendarColor: string;
  height: number;
  onClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onHover: (eventId: string | null) => void;
}

export const WeekViewEvent: React.FC<WeekViewEventProps> = ({
  event,
  isSelected,
  isHovered,
  calendarColor,
  height,
  onClick,
  onHover,
}) => {
  const isShortEvent = height < 40;
  const isMediumEvent = height >= 40 && height < 80;
  const isLongEvent = height >= 80;

  const getStatusIcon = () => {
    switch (event.status) {
      case 'tentative':
        return <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0" />;
      case 'cancelled':
        return <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getTimeDisplay = () => {
    if (event.is_all_day) {
      return 'Todo el día';
    }

    const startTime = format(new Date(event.start_datetime), 'HH:mm');
    const endTime = format(new Date(event.end_datetime), 'HH:mm');

    return `${startTime} - ${endTime}`;
  };

  const getEventClasses = () => {
    let classes =
      'w-full h-full rounded-sm shadow-sm cursor-pointer transition-all duration-200 overflow-hidden border-l-2';

    // Status-based styling
    if (event.status === 'cancelled') {
      classes += ' opacity-60';
    } else if (event.status === 'tentative') {
      classes += ' opacity-80 border-dashed border-2';
    }

    // Selection and hover states
    if (isSelected) {
      classes += ' ring-2 ring-white ring-opacity-60 shadow-lg transform scale-105 z-50';
    } else if (isHovered) {
      classes += ' shadow-md transform scale-102 z-40';
    }

    return classes;
  };

  const getBackgroundStyle = () => {
    const baseOpacity = isHovered || isSelected ? 0.95 : 0.9;

    if (event.status === 'cancelled') {
      return {
        backgroundColor: `${calendarColor}30`,
        borderLeftColor: calendarColor,
        color: calendarColor,
      };
    }

    if (event.status === 'tentative') {
      return {
        backgroundColor: `${calendarColor}40`,
        borderColor: calendarColor,
        borderLeftColor: calendarColor,
        color: calendarColor,
      };
    }

    return {
      backgroundColor: `${calendarColor}${Math.round(baseOpacity * 255)
        .toString(16)
        .padStart(2, '0')}`,
      borderLeftColor: calendarColor,
      color: 'white',
    };
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

  const renderEventContent = () => {
    if (isShortEvent) {
      // Compact view for very short events
      return (
        <div className="p-1 h-full flex items-center">
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            <Clock className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="text-xs font-medium truncate">{event.title}</span>
            {getStatusIcon()}
          </div>
        </div>
      );
    }

    if (isMediumEvent) {
      // Medium view with title and time
      return (
        <div className="p-2 h-full">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-xs font-semibold leading-tight truncate flex-1">{event.title}</h3>
            {getStatusIcon()}
          </div>

          <div className="flex items-center space-x-1 text-xs opacity-90">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{getTimeDisplay()}</span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-1 text-xs opacity-75 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      );
    }

    // Full view for long events
    return (
      <div className="p-2 h-full flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold leading-tight flex-1 pr-2">{event.title}</h3>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {getStatusIcon()}
            <MoreVertical className="h-3 w-3 opacity-60" />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-1 opacity-90">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{getTimeDisplay()}</span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-1 opacity-75">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center space-x-1 opacity-75">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span>
                {event.attendees.length} asistente{event.attendees.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {event.description && isLongEvent && height > 120 && (
          <div className="mt-2 flex-1 overflow-hidden">
            <p className="text-xs opacity-75 line-clamp-3">{event.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={getEventClasses()}
      style={getBackgroundStyle()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${event.title}${event.description ? `\n${event.description}` : ''}${event.location ? `\n📍 ${event.location}` : ''}`}
    >
      {renderEventContent()}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-white bg-opacity-20 pointer-events-none rounded-sm" />
      )}

      {/* Hover Enhancement */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-white bg-opacity-10 pointer-events-none rounded-sm" />
      )}
    </div>
  );
};
