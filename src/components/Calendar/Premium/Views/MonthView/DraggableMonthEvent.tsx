import React, { useRef } from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { format } from 'date-fns';
import { MapPin, Users, AlertTriangle, Move } from 'lucide-react';
import type { CalendarEvent } from '../../../../../types/calendar';

interface DraggableMonthEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  isHovered: boolean;
  calendarColor: string;
  onClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onHover: (eventId: string | null) => void;
}

export const DraggableMonthEvent: React.FC<DraggableMonthEventProps> = ({
  event,
  isSelected,
  isHovered,
  calendarColor,
  onClick,
  onHover,
}) => {
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'calendar-event',
    item: { event },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(dragRef);

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

  // Removed getEventTypeIcon since we're using a more compact layout

  const getTimeDisplay = () => {
    if (event.is_all_day) {
      return 'Todo el día';
    }

    const startTime = format(new Date(event.start_datetime), 'HH:mm');
    return startTime;
  };

  const getEventClasses = () => {
    const baseClasses =
      'group w-full text-left text-xs rounded px-1 py-0.5 transition-all duration-200 relative overflow-hidden cursor-move';

    let classes = baseClasses;

    // Drag state styling
    if (isDragging) {
      classes += ' opacity-50 scale-95 z-50';
    } else {
      classes += ' hover:scale-102 hover:shadow-lg';
    }

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

    if (isHovered && !isSelected && !isDragging) {
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

    // Apply drag visual feedback
    let style: React.CSSProperties = {};

    if (isDragging) {
      style.transform = 'rotate(5deg)';
      style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
      baseOpacity = 0.8;
    }

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

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick(event, e);
    }
  };

  const handleMouseEnter = () => {
    if (!isDragging) {
      onHover(event.id);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      onHover(null);
    }
  };

  return (
    <div
      ref={dragRef}
      className={getEventClasses()}
      style={getBackgroundStyle()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${event.title}${event.description ? `\n${event.description}` : ''}${event.location ? `\n📍 ${event.location}` : ''}\n\n🖱️ Arrastra para mover`}
    >
      {/* Compact Event Content - Single line */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-1 min-w-0 flex-1">
          {/* Drag handle - smaller */}
          <div className="opacity-40 group-hover:opacity-70 transition-opacity flex-shrink-0">
            <Move className="h-2 w-2" />
          </div>

          {/* Time - only if not all day */}
          {!event.is_all_day && (
            <span className="text-xs opacity-75 flex-shrink-0">{getTimeDisplay()}</span>
          )}

          {/* Title - truncated */}
          <span className="font-medium text-xs truncate flex-1">{event.title}</span>

          {/* Status icon */}
          {getStatusIcon()}
        </div>

        {/* Compact indicators */}
        <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
          {/* Location indicator - just icon */}
          {event.location && <MapPin className="h-2 w-2 opacity-60" />}

          {/* Attendee count */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center opacity-60">
              <Users className="h-2 w-2" />
              <span className="text-xs ml-0.5">{event.attendees.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-white bg-opacity-20 pointer-events-none" />
      )}

      {/* Hover Enhancement */}
      {isHovered && !isSelected && !isDragging && (
        <div className="absolute inset-0 bg-white bg-opacity-10 pointer-events-none" />
      )}

      {/* Drag Preview Overlay */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 animate-pulse" />
          <div className="absolute top-1 right-1">
            <Move className="h-3 w-3 text-blue-600 animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
};
