import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, Users, AlertTriangle, Move } from 'lucide-react';
import type { CalendarEvent } from '../../../../../types/calendar';
import { useSimpleDrag } from '../../../../../hooks/useSimpleDrag';

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
  onEventUpdate = async () => {},
}) => {
  const eventRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Simple drag functionality
  const handleEventMove = async (eventId: string, deltaX: number, deltaY: number) => {
    // Convert pixel movement to time/date changes
    const dayChange = Math.round(deltaX / 120); // 120px = 1 day
    const hourChange = Math.round(deltaY / 40);  // 40px = 1 hour
    
    const originalStart = new Date(event.start_datetime);
    const originalEnd = new Date(event.end_datetime);
    
    // Calculate new dates
    const newStart = new Date(originalStart);
    newStart.setDate(newStart.getDate() + dayChange);
    newStart.setHours(newStart.getHours() + hourChange);
    
    const newEnd = new Date(originalEnd);
    newEnd.setDate(newEnd.getDate() + dayChange);
    newEnd.setHours(newEnd.getHours() + hourChange);
    
    console.log(`📅 Moving event: ${dayChange} days, ${hourChange} hours`);
    
    // Update the event
    await onEventUpdate(eventId, {
      start_datetime: newStart.toISOString(),
      end_datetime: newEnd.toISOString(),
    });
  };
  
  const { dragState, handlers } = useSimpleDrag(handleEventMove);

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
      'group w-full text-left text-xs rounded p-1 mb-1 transition-all duration-200 relative overflow-hidden';

    let classes = baseClasses;
    
    // Drag cursor
    if (!isDragDisabled && !dragState.isDragging) {
      classes += ' cursor-move hover:cursor-move';
    } else if (dragState.isDragging && dragState.draggedEventId === event.id) {
      classes += ' cursor-grabbing';
    } else {
      classes += ' cursor-pointer';
    }

    // Status-based styling
    if (event.status === 'cancelled') {
      classes += ' opacity-60 line-through';
    } else if (event.status === 'tentative') {
      classes += ' opacity-80 border-2 border-dashed';
    }

    // Drag state styling
    if (dragState.isDragging && dragState.draggedEventId === event.id) {
      classes += ' z-50 opacity-90 scale-105 ring-2 ring-blue-400';
    } else if (dragState.isDragging) {
      classes += ' opacity-70';
    }

    // Selection and hover states
    if (isSelected) {
      classes += ' ring-2 ring-white ring-opacity-60 transform scale-105 z-10';
    }

    if (isHovered && !isSelected && !dragState.isDragging) {
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
    
    if (dragState.isDragging && dragState.draggedEventId === event.id) {
      style.transform = 'scale(1.05)';
      style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
      baseOpacity = 0.9;
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

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDragDisabled || e.button !== 0) return; // Only left click
    
    e.preventDefault();
    isDragging.current = false;
    
    const startPosition = { x: e.clientX, y: e.clientY };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) {
        const distance = Math.sqrt(
          Math.pow(moveEvent.clientX - startPosition.x, 2) +
          Math.pow(moveEvent.clientY - startPosition.y, 2)
        );
        
        if (distance > 5) { // Start drag after 5px movement
          isDragging.current = true;
          handlers.startDrag(event.id, startPosition);
        }
      }
      
      if (isDragging.current) {
        handlers.updateDrag({ x: moveEvent.clientX, y: moveEvent.clientY });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (isDragging.current) {
        handlers.endDrag();
      } else {
        // It was a click, not a drag
        onClick(event, e);
      }
      
      isDragging.current = false;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Click is handled in mouseup if not dragging
    if (!isDragging.current) {
      onClick(event, e);
    }
  };

  const handleMouseEnter = () => {
    if (!dragState.isDragging) {
      onHover(event.id);
    }
  };

  const handleMouseLeave = () => {
    if (!dragState.isDragging) {
      onHover(null);
    }
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
      {isHovered && !isSelected && !dragState.isDragging && (
        <div className="absolute inset-0 bg-white bg-opacity-10 pointer-events-none" />
      )}
      
      {/* Drag Preview Overlay */}
      {dragState.isDragging && dragState.draggedEventId === event.id && (
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