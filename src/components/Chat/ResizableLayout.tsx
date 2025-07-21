import React, { useState, useRef, useEffect } from 'react';

// Global ResizeObserver declaration
declare global {
  interface Window {
    ResizeObserver: typeof ResizeObserver;
  }
}

interface ResizableLayoutProps {
  children: React.ReactNode[];
  darkMode: boolean;
  sidebarCollapsed?: boolean;
  onSidebarWidthChange?: (width: number) => void;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  children,
  darkMode,
  sidebarCollapsed = false,
  onSidebarWidthChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(350); // Default to minimum width
  const [columnWidths, setColumnWidths] = useState<number[]>([0, 0, 0]);
  const [isResizing, setIsResizing] = useState<number | null>(null);

  // Notify parent of initial sidebar width
  useEffect(() => {
    onSidebarWidthChange?.(sidebarWidth);
  }, []); // Only on mount

  // Sidebar constraints (25% wider)
  const MIN_SIDEBAR_WIDTH = sidebarCollapsed ? 80 : 350; // 25% wider than original
  const MIN_COLUMN_WIDTH = 300;

  // Calculate max sidebar width (1/3 of screen)
  const getMaxSidebarWidth = () => {
    if (!containerRef.current) return 500;
    return Math.floor(containerRef.current.offsetWidth / 3);
  };

  // Calculate column widths based on container size
  useEffect(() => {
    const calculateWidths = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const maxSidebarWidth = getMaxSidebarWidth();

      // Ensure sidebar width is within bounds
      const actualSidebarWidth = sidebarCollapsed ? 80 : Math.min(sidebarWidth, maxSidebarWidth);
      if (actualSidebarWidth !== sidebarWidth && !sidebarCollapsed) {
        setSidebarWidth(actualSidebarWidth);
        onSidebarWidthChange?.(actualSidebarWidth);
      }

      const availableWidth = containerWidth - actualSidebarWidth;

      // Templates column uses minimum width by default, only expands manually
      const TEMPLATES_MIN_WIDTH = MIN_COLUMN_WIDTH; // 300px

      setColumnWidths(prevWidths => {
        // If we have existing widths, maintain them but templates stays minimal unless manually resized
        const currentTotal = prevWidths.reduce((a, b) => a + b, 0);
        if (currentTotal > 0) {
          // Keep templates column at minimum unless it was manually expanded
          const templatesWidth =
            prevWidths[1] > TEMPLATES_MIN_WIDTH ? prevWidths[1] : TEMPLATES_MIN_WIDTH;
          const remainingWidth = availableWidth - templatesWidth;

          // Split remaining width: AI Chat (40%), Conversation (40%), Templates (20%)
          const aiChatWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth * 0.4);
          const conversationWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth * 0.4);
          const templatesWidthNew = Math.max(TEMPLATES_MIN_WIDTH, availableWidth * 0.2);

          return [conversationWidth, templatesWidthNew, aiChatWidth];
        }

        // Initial load: Templates gets minimum width, rest split between Conversation and AI Chat
        const templatesWidth = TEMPLATES_MIN_WIDTH;
        const remainingWidth = availableWidth - templatesWidth;
        const conversationWidth = Math.max(MIN_COLUMN_WIDTH, remainingWidth * 0.5);
        const aiChatWidth = Math.max(MIN_COLUMN_WIDTH, remainingWidth * 0.5);

        return [conversationWidth, templatesWidth, aiChatWidth];
      });
    };

    calculateWidths();
  }, [sidebarCollapsed, sidebarWidth, onSidebarWidthChange]);

  // ResizeObserver for more accurate container size detection
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const containerWidth = entry.contentRect.width;
          const actualSidebarWidth = sidebarCollapsed ? 80 : sidebarWidth;
          const availableWidth = containerWidth - actualSidebarWidth;

          // Force recalculation with current dimensions
          const TEMPLATES_MIN_WIDTH = MIN_COLUMN_WIDTH; // 300px

          setColumnWidths(prevWidths => {
            const currentTotal = prevWidths.reduce((a, b) => a + b, 0);
            if (currentTotal > 0) {
              // Keep templates column at minimum unless it was manually expanded
              const templatesWidth =
                prevWidths[1] > TEMPLATES_MIN_WIDTH ? prevWidths[1] : TEMPLATES_MIN_WIDTH;
              // Keep proportional layout: AI Chat (40%), Conversation (40%), Templates (20%)
              const aiChatWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth * 0.4);
              const conversationWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth * 0.4);
              const templatesWidthNew = Math.max(TEMPLATES_MIN_WIDTH, availableWidth * 0.2);

              return [conversationWidth, templatesWidthNew, aiChatWidth];
            }

            // Initial load: Use proportional layout AI Chat (40%), Conversation (40%), Templates (20%)
            const aiChatWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth * 0.4);
            const conversationWidth = Math.max(MIN_COLUMN_WIDTH, availableWidth * 0.4);
            const templatesWidth = Math.max(TEMPLATES_MIN_WIDTH, availableWidth * 0.2);

            return [conversationWidth, templatesWidth, aiChatWidth];
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [sidebarCollapsed, sidebarWidth]);

  // Handle window resize separately to recalculate columns when needed
  useEffect(() => {
    const handleWindowResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const actualSidebarWidth = sidebarCollapsed ? 80 : sidebarWidth;
      const availableWidth = containerWidth - actualSidebarWidth;

      setColumnWidths(prevWidths => {
        const currentTotal = prevWidths.reduce((a, b) => a + b, 0);
        if (currentTotal > 0) {
          // Keep templates at minimum unless manually expanded, scale only Conversation and AI Chat
          const TEMPLATES_MIN_WIDTH = MIN_COLUMN_WIDTH; // 300px
          const templatesWidth =
            prevWidths[1] > TEMPLATES_MIN_WIDTH ? prevWidths[1] : TEMPLATES_MIN_WIDTH;
          const remainingWidth = availableWidth - templatesWidth;

          // Calculate scale for conversation and AI chat columns only
          const otherColumnsTotal = prevWidths[0] + prevWidths[2];
          if (otherColumnsTotal > 0) {
            const scale = remainingWidth / otherColumnsTotal;
            const conversationWidth = Math.max(MIN_COLUMN_WIDTH, prevWidths[0] * scale);
            const aiChatWidth = Math.max(MIN_COLUMN_WIDTH, prevWidths[2] * scale);
            return [conversationWidth, templatesWidth, aiChatWidth];
          } else {
            // Fallback: split remaining width equally
            const conversationWidth = Math.max(MIN_COLUMN_WIDTH, remainingWidth * 0.5);
            const aiChatWidth = Math.max(MIN_COLUMN_WIDTH, remainingWidth * 0.5);
            return [conversationWidth, templatesWidth, aiChatWidth];
          }
        }
        return prevWidths;
      });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [sidebarCollapsed]);

  // Throttle function for better performance
  const throttle = <T extends unknown[]>(func: (...args: T) => void, limit: number) => {
    let inThrottle: boolean;
    return function (...args: T) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // Handle resizing
  useEffect(() => {
    if (isResizing === null) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
      e.stopPropagation();
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;

      if (isResizing === -1) {
        // Resizing sidebar - only changes sidebar width, columns adjust naturally
        const maxWidth = getMaxSidebarWidth();
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(mouseX, maxWidth));
        setSidebarWidth(newWidth);
        onSidebarWidthChange?.(newWidth);

        // Recalculate column widths to maintain proportions
        const availableWidth = containerRect.width - newWidth;
        setColumnWidths(prevWidths => {
          const currentTotal = prevWidths.reduce((a, b) => a + b, 0);
          if (currentTotal > 0) {
            const scale = availableWidth / currentTotal;
            return prevWidths.map(w => Math.max(MIN_COLUMN_WIDTH, w * scale));
          }
          return prevWidths;
        });
      } else {
        // Resizing other columns
        const actualSidebarWidth = sidebarCollapsed ? 80 : sidebarWidth;
        const mouseXRelative = mouseX - actualSidebarWidth;

        setColumnWidths(prevWidths => {
          const newWidths = [...prevWidths];
          const totalWidth = containerRect.width - actualSidebarWidth;

          if (isResizing === 0) {
            // Resizing between chat and templates (AI remains fixed)
            const aiWidth = prevWidths[2]; // Keep AI column fixed
            const availableSpace = totalWidth - aiWidth;

            // Calculate limits for chat width
            const maxChatWidth = availableSpace - MIN_COLUMN_WIDTH; // Leave minimum space for templates
            const minChatWidth = MIN_COLUMN_WIDTH;

            // Calculate new chat width based on mouse position
            const newChatWidth = Math.max(minChatWidth, Math.min(mouseXRelative, maxChatWidth));
            const newTemplatesWidth = availableSpace - newChatWidth;

            newWidths[0] = newChatWidth;
            newWidths[1] = newTemplatesWidth;
            newWidths[2] = aiWidth; // AI stays fixed
          } else if (isResizing === 1) {
            // Resizing between templates and AI (chat remains fixed)
            const chatWidth = prevWidths[0]; // Keep chat column fixed
            const availableSpace = totalWidth - chatWidth;

            // Calculate limits for templates width
            const maxTemplatesWidth = availableSpace - MIN_COLUMN_WIDTH; // Leave minimum space for AI
            const minTemplatesWidth = MIN_COLUMN_WIDTH;

            // Calculate new templates width based on mouse position (relative to templates start)
            const templatesStartX = chatWidth;
            const templatesMouseX = mouseXRelative - templatesStartX;
            const newTemplatesWidth = Math.max(
              minTemplatesWidth,
              Math.min(templatesMouseX, maxTemplatesWidth),
            );
            const newAIWidth = availableSpace - newTemplatesWidth;

            newWidths[0] = chatWidth; // Chat stays fixed
            newWidths[1] = newTemplatesWidth;
            newWidths[2] = newAIWidth;
          }

          return newWidths;
        });
      }
    }, 16); // Throttle to ~60fps for smooth resizing

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth, sidebarCollapsed, onSidebarWidthChange]);

  // Ensure we have 4 children (sidebar, chat, templates, AI)
  if (children.length !== 4) {
    console.error('ResizableLayout expects exactly 4 children');
    return null;
  }

  const actualSidebarWidth = sidebarCollapsed ? 80 : sidebarWidth;

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* Sidebar - Resizable width */}
      <div
        style={{ width: `${actualSidebarWidth}px` }}
        className="flex-shrink-0 h-full overflow-hidden transition-all duration-300"
      >
        {children[0]}
      </div>

      {/* Sidebar Resizer - Only show when not collapsed */}
      {!sidebarCollapsed && (
        <div
          className={`w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 ${
            isResizing === -1 ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
          }`}
          onMouseDown={e => {
            e.stopPropagation();
            setIsResizing(-1);
          }}
        />
      )}

      {/* Chat Column */}
      <div
        style={{ width: `${columnWidths[0]}px` }}
        className="h-full overflow-hidden flex-shrink-0"
      >
        {children[1]}
      </div>

      {/* Resizer between Chat and Templates */}
      <div
        className={`w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 ${
          isResizing === 0 ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}
        onMouseDown={e => {
          e.stopPropagation();
          setIsResizing(0);
        }}
      />

      {/* Templates Column */}
      <div
        style={{ width: `${columnWidths[1]}px` }}
        className="h-full overflow-hidden flex-shrink-0"
      >
        {children[2]}
      </div>

      {/* Resizer between Templates and AI */}
      <div
        className={`w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 ${
          isResizing === 1 ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}
        onMouseDown={e => {
          e.stopPropagation();
          setIsResizing(1);
        }}
      />

      {/* AI Column */}
      <div
        style={{ width: `${columnWidths[2]}px` }}
        className="h-full overflow-hidden flex-shrink-0"
      >
        {children[3]}
      </div>
    </div>
  );
};
