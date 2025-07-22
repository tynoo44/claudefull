import React from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, Users, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import type { CalendarEvent, GoogleCalendar } from '../../../../../types/calendar';

interface AgendaViewItemProps {
  event: CalendarEvent;
  isSelected: boolean;
  isHovered: boolean;
  calendarColor: string;
  calendar?: GoogleCalendar;
  onClick: (event: CalendarEvent) => void;
  onHover: (eventId: string | null) => void;
}

export const AgendaViewItem: React.FC<AgendaViewItemProps> = ({
  event,
  isSelected,
  isHovered,
  calendarColor,
  calendar,
  onClick,
  onHover,
}) => {
  const getStatusIcon = () => {
    switch (event.status) {
      case 'tentative':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTimeDisplay = () => {
    if (event.is_all_day) {
      return 'Todo el día';
    }

    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    const startTime = format(start, 'HH:mm');
    const endTime = format(end, 'HH:mm');

    // Calculate duration
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    let duration = '';
    if (durationHours > 0) {
      duration = `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`;
    } else {
      duration = `${durationMinutes}m`;
    }

    return `${startTime} - ${endTime} (${duration})`;
  };

  const getEventClasses = () => {
    let classes =
      'p-4 cursor-pointer transition-all duration-200 border-l-4 hover:bg-white dark:hover:bg-gray-600';

    // Status-based styling
    if (event.status === 'cancelled') {
      classes += ' opacity-60';
    }

    // Selection and hover states
    if (isSelected) {
      classes += ' bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700';
    } else if (isHovered) {
      classes += ' bg-gray-50 dark:bg-gray-600';
    }

    return classes;
  };

  const getPriorityIndicator = () => {
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const hasLocation = !!event.location;

    if (event.status === 'cancelled')
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
    if (event.status === 'tentative')
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
    if (hasAttendees && hasLocation)
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
    if (hasAttendees || hasLocation)
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';

    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const handleClick = () => {
    onClick(event);
  };

  const handleMouseEnter = () => {
    onHover(event.id);
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  return (
    <div
      className={getEventClasses()}
      style={{ borderLeftColor: calendarColor }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start justify-between">
        {/* Event Main Info */}
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-2">
            <h3
              className={`font-semibold text-gray-900 dark:text-gray-100 mr-2 ${
                event.status === 'cancelled' ? 'line-through' : ''
              }`}
            >
              {event.title}
            </h3>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {getStatusIcon()}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityIndicator()}`}
              >
                {event.status === 'cancelled'
                  ? 'Cancelado'
                  : event.status === 'tentative'
                    ? 'Tentativo'
                    : 'Confirmado'}
              </span>
            </div>
          </div>

          {/* Time and Duration */}
          <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{getTimeDisplay()}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>
                {event.attendees.length} asistente{event.attendees.length !== 1 ? 's' : ''}
              </span>
              {/* Show first few attendees */}
              <div className="flex items-center space-x-1 ml-2">
                {event.attendees.slice(0, 3).map((attendee, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300"
                    title={attendee.display_name || attendee.email}
                  >
                    {(attendee.display_name || attendee.email).charAt(0).toUpperCase()}
                  </div>
                ))}
                {event.attendees.length > 3 && (
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    +{event.attendees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description preview */}
          {event.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              <p className="line-clamp-2">{event.description}</p>
            </div>
          )}

          {/* Calendar Source */}
          {calendar && (
            <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <Calendar className="h-3 w-3" style={{ color: calendarColor }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{calendar.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 pointer-events-none" />
      )}
    </div>
  );
};
