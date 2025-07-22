// =============================================================================
// DRAG & DROP HOOK - PROFESSIONAL CALENDAR SYSTEM
// =============================================================================
// Sistema avanzado de drag & drop para eventos de calendario con detección de conflictos

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CalendarEvent } from '../types/calendar';

// =============================================================================
// TYPES
// =============================================================================

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  draggedEvent: CalendarEvent | null;
  originalPosition: {
    startDate: Date;
    endDate: Date;
    x: number;
    y: number;
  } | null;
  currentPosition: {
    startDate: Date;
    endDate: Date;
    x: number;
    y: number;
  } | null;
  previewEvent: CalendarEvent | null;
  conflicts: CalendarEvent[];
  isValid: boolean;
}

export interface DropTarget {
  date: Date;
  time?: string;
  duration?: number;
  calendarId?: string;
}

interface DragHandlers {
  onDragStart: (
    event: CalendarEvent,
    dragType: 'move' | 'resize-start' | 'resize-end',
    initialPosition: { x: number; y: number },
  ) => void;
  onDragMove: (position: { x: number; y: number }, dropTarget?: DropTarget) => void;
  onDragEnd: (dropTarget?: DropTarget) => void;
  onDragCancel: () => void;
}

interface ConflictDetectionOptions {
  checkOverlaps: boolean;
  checkCalendarConflicts: boolean;
  allowPartialOverlaps: boolean;
  minimumGap: number; // minutes
}

// =============================================================================
// DRAG & DROP HOOK
// =============================================================================

export const useDragAndDrop = (
  allEvents: CalendarEvent[],
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>,
  conflictOptions: ConflictDetectionOptions = {
    checkOverlaps: true,
    checkCalendarConflicts: false,
    allowPartialOverlaps: false,
    minimumGap: 15,
  },
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    draggedEvent: null,
    originalPosition: null,
    currentPosition: null,
    previewEvent: null,
    conflicts: [],
    isValid: true,
  });

  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragThreshold = 5; // pixels before drag starts

  // =============================================================================
  // CONFLICT DETECTION
  // =============================================================================

  const detectConflicts = useCallback(
    (event: CalendarEvent, newStartDate: Date, newEndDate: Date): CalendarEvent[] => {
      if (!conflictOptions.checkOverlaps) return [];

      return allEvents.filter(existingEvent => {
        // Skip self
        if (existingEvent.id === event.id) return false;

        // Skip events from different calendars if not checking cross-calendar conflicts
        if (
          !conflictOptions.checkCalendarConflicts &&
          existingEvent.google_calendar_id !== event.google_calendar_id
        ) {
          return false;
        }

        const existingStart = new Date(existingEvent.start_datetime);
        const existingEnd = new Date(existingEvent.end_datetime);

        // Add minimum gap if specified
        const gapMs = conflictOptions.minimumGap * 60 * 1000;
        const adjustedNewStart = new Date(newStartDate.getTime() - gapMs);
        const adjustedNewEnd = new Date(newEndDate.getTime() + gapMs);

        // Check for overlaps
        if (conflictOptions.allowPartialOverlaps) {
          // Only conflicts if fully overlapping
          return (
            (adjustedNewStart <= existingStart && adjustedNewEnd >= existingEnd) ||
            (existingStart <= adjustedNewStart && existingEnd >= adjustedNewEnd)
          );
        } else {
          // Any overlap is a conflict
          return adjustedNewStart < existingEnd && adjustedNewEnd > existingStart;
        }
      });
    },
    [allEvents, conflictOptions],
  );

  // =============================================================================
  // DRAG CALCULATIONS
  // =============================================================================

  const calculateNewDateTime = useCallback(
    (
      originalEvent: CalendarEvent,
      dragType: 'move' | 'resize-start' | 'resize-end',
      deltaX: number,
      deltaY: number,
      dropTarget?: DropTarget,
    ): { startDate: Date; endDate: Date } => {
      const originalStart = new Date(originalEvent.start_datetime);
      const originalEnd = new Date(originalEvent.end_datetime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      if (dropTarget) {
        // Precise drop target provided
        const targetDate = new Date(dropTarget.date);

        if (dropTarget.time) {
          const [hours, minutes] = dropTarget.time.split(':').map(Number);
          targetDate.setHours(hours, minutes, 0, 0);
        }

        switch (dragType) {
          case 'move': {
            return {
              startDate: targetDate,
              endDate: new Date(targetDate.getTime() + duration),
            };
          }
          case 'resize-start': {
            return {
              startDate: targetDate,
              endDate: originalEnd,
            };
          }
          case 'resize-end': {
            return {
              startDate: originalStart,
              endDate: targetDate,
            };
          }
        }
      }

      // Fallback to delta calculations
      // This is a simplified version - in practice you'd convert pixel deltas
      // to time/date deltas based on calendar view and grid size
      const timeDelta = (deltaY / 30) * 30 * 60 * 1000; // Assume 30px = 30min
      const dayDelta = Math.round(deltaX / 100) * 24 * 60 * 60 * 1000; // Assume 100px = 1 day

      const totalDelta = timeDelta + dayDelta;

      switch (dragType) {
        case 'move': {
          return {
            startDate: new Date(originalStart.getTime() + totalDelta),
            endDate: new Date(originalEnd.getTime() + totalDelta),
          };
        }
        case 'resize-start': {
          return {
            startDate: new Date(originalStart.getTime() + totalDelta),
            endDate: originalEnd,
          };
        }
        case 'resize-end': {
          return {
            startDate: originalStart,
            endDate: new Date(originalEnd.getTime() + totalDelta),
          };
        }
        default: {
          return { startDate: originalStart, endDate: originalEnd };
        }
      }
    },
    [],
  );

  // =============================================================================
  // DRAG HANDLERS
  // =============================================================================

  const handleDragStart = useCallback(
    (
      event: CalendarEvent,
      dragType: 'move' | 'resize-start' | 'resize-end',
      initialPosition: { x: number; y: number },
    ) => {
      const originalStart = new Date(event.start_datetime);
      const originalEnd = new Date(event.end_datetime);

      dragStartPos.current = initialPosition;

      setDragState({
        isDragging: true,
        dragType,
        draggedEvent: event,
        originalPosition: {
          startDate: originalStart,
          endDate: originalEnd,
          x: initialPosition.x,
          y: initialPosition.y,
        },
        currentPosition: {
          startDate: originalStart,
          endDate: originalEnd,
          x: initialPosition.x,
          y: initialPosition.y,
        },
        previewEvent: { ...event },
        conflicts: [],
        isValid: true,
      });

      // Add visual feedback
      document.body.style.cursor = dragType === 'move' ? 'move' : 'row-resize';
      document.body.classList.add('calendar-dragging');
    },
    [],
  );

  const handleDragMove = useCallback(
    (position: { x: number; y: number }, dropTarget?: DropTarget) => {
      if (!dragState.isDragging || !dragState.draggedEvent || !dragState.originalPosition) {
        return;
      }

      const deltaX = position.x - dragStartPos.current.x;
      const deltaY = position.y - dragStartPos.current.y;

      // Check if we've moved enough to start actual dragging
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < dragThreshold) return;

      const { startDate, endDate } = calculateNewDateTime(
        dragState.draggedEvent,
        dragState.dragType!,
        deltaX,
        deltaY,
        dropTarget,
      );

      // Validate the new time range
      const isValidTimeRange = startDate < endDate;
      const conflicts = isValidTimeRange
        ? detectConflicts(dragState.draggedEvent, startDate, endDate)
        : [];

      const previewEvent: CalendarEvent = {
        ...dragState.draggedEvent,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
      };

      setDragState(prev => ({
        ...prev,
        currentPosition: {
          startDate,
          endDate,
          x: position.x,
          y: position.y,
        },
        previewEvent,
        conflicts,
        isValid: isValidTimeRange && conflicts.length === 0,
      }));
    },
    [dragState, calculateNewDateTime, detectConflicts],
  );

  const handleDragEnd = useCallback(
    async (_dropTarget?: DropTarget) => {
      if (!dragState.isDragging || !dragState.draggedEvent || !dragState.currentPosition) {
        return;
      }

      const { draggedEvent, currentPosition, isValid } = dragState;

      // Reset UI state immediately
      document.body.style.cursor = '';
      document.body.classList.remove('calendar-dragging');

      try {
        if (isValid) {
          // Update the event
          await onEventUpdate(draggedEvent.id, {
            start_datetime: currentPosition.startDate.toISOString(),
            end_datetime: currentPosition.endDate.toISOString(),
          });

          console.log('✅ Event updated successfully:', {
            eventId: draggedEvent.id,
            newStart: currentPosition.startDate,
            newEnd: currentPosition.endDate,
          });
        } else {
          console.log('❌ Drag cancelled - invalid drop position');
        }
      } catch (error) {
        console.error('Failed to update event:', error);
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        dragType: null,
        draggedEvent: null,
        originalPosition: null,
        currentPosition: null,
        previewEvent: null,
        conflicts: [],
        isValid: true,
      });
    },
    [dragState, onEventUpdate],
  );

  const handleDragCancel = useCallback(() => {
    document.body.style.cursor = '';
    document.body.classList.remove('calendar-dragging');

    setDragState({
      isDragging: false,
      dragType: null,
      draggedEvent: null,
      originalPosition: null,
      currentPosition: null,
      previewEvent: null,
      conflicts: [],
      isValid: true,
    });
  }, []);

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dragState.isDragging && e.key === 'Escape') {
        handleDragCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dragState.isDragging, handleDragCancel]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  const handlers: DragHandlers = {
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  };

  return {
    dragState,
    handlers,
    isConflicted: dragState.conflicts.length > 0,
    conflictCount: dragState.conflicts.length,
    conflictingEvents: dragState.conflicts,
  };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getDragCursor = (dragType: 'move' | 'resize-start' | 'resize-end' | null): string => {
  switch (dragType) {
    case 'move':
      return 'move';
    case 'resize-start':
    case 'resize-end':
      return 'row-resize';
    default:
      return 'default';
  }
};

export const getDragVisualFeedback = (dragState: DragState) => {
  if (!dragState.isDragging) return null;

  return {
    opacity: dragState.isValid ? 0.8 : 0.5,
    borderColor: dragState.isValid ? '#10b981' : '#ef4444',
    backgroundColor: dragState.conflicts.length > 0 ? '#fef2f2' : '#f0fdf4',
    transform: 'scale(1.02)',
    boxShadow: dragState.isValid
      ? '0 8px 16px rgba(16, 185, 129, 0.3)'
      : '0 8px 16px rgba(239, 68, 68, 0.3)',
  };
};
