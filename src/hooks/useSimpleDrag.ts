// =============================================================================
// SIMPLE DRAG & DROP HOOK - FUNCIONAL Y DIRECTO
// =============================================================================

import { useState, useCallback } from 'react';
import type { CalendarEvent } from '../types/calendar';

export interface SimpleDragState {
  isDragging: boolean;
  draggedEventId: string | null;
  dragStartPos: { x: number; y: number } | null;
  dragCurrentPos: { x: number; y: number } | null;
}

interface SimpleDragHandlers {
  startDrag: (eventId: string, startPos: { x: number; y: number }) => void;
  updateDrag: (currentPos: { x: number; y: number }) => void;
  endDrag: () => void;
  cancelDrag: () => void;
}

export const useSimpleDrag = (
  onEventMove: (eventId: string, deltaX: number, deltaY: number) => Promise<void>,
) => {
  const [dragState, setDragState] = useState<SimpleDragState>({
    isDragging: false,
    draggedEventId: null,
    dragStartPos: null,
    dragCurrentPos: null,
  });

  const startDrag = useCallback((eventId: string, startPos: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      draggedEventId: eventId,
      dragStartPos: startPos,
      dragCurrentPos: startPos,
    });

    // Visual feedback
    document.body.style.cursor = 'grabbing';
    document.body.classList.add('calendar-dragging');

    console.log('🖱️ Started dragging event:', eventId);
  }, []);

  const updateDrag = useCallback(
    (currentPos: { x: number; y: number }) => {
      if (!dragState.isDragging) return;

      setDragState(prev => ({
        ...prev,
        dragCurrentPos: currentPos,
      }));
    },
    [dragState.isDragging],
  );

  const endDrag = useCallback(async () => {
    if (
      !dragState.isDragging ||
      !dragState.draggedEventId ||
      !dragState.dragStartPos ||
      !dragState.dragCurrentPos
    ) {
      return;
    }

    const deltaX = dragState.dragCurrentPos.x - dragState.dragStartPos.x;
    const deltaY = dragState.dragCurrentPos.y - dragState.dragStartPos.y;

    // Reset visual state
    document.body.style.cursor = '';
    document.body.classList.remove('calendar-dragging');

    try {
      // Only process significant movements (more than 10px)
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        await onEventMove(dragState.draggedEventId, deltaX, deltaY);
        console.log('✅ Event moved successfully:', {
          eventId: dragState.draggedEventId,
          deltaX,
          deltaY,
        });
      } else {
        console.log('ℹ️ Drag cancelled - insufficient movement');
      }
    } catch (error) {
      console.error('❌ Failed to move event:', error);
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedEventId: null,
      dragStartPos: null,
      dragCurrentPos: null,
    });
  }, [dragState, onEventMove]);

  const cancelDrag = useCallback(() => {
    document.body.style.cursor = '';
    document.body.classList.remove('calendar-dragging');

    setDragState({
      isDragging: false,
      draggedEventId: null,
      dragStartPos: null,
      dragCurrentPos: null,
    });

    console.log('❌ Drag cancelled');
  }, []);

  const handlers: SimpleDragHandlers = {
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };

  return {
    dragState,
    handlers,
  };
};
