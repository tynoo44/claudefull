import React, { useState, useRef, useEffect } from 'react';

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
  onSidebarWidthChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default 384px (w-96)
  const [columnWidths, setColumnWidths] = useState<number[]>([0, 0, 0]);
  const [isResizing, setIsResizing] = useState<number | null>(null);
  
  // Sidebar constraints
  const MIN_SIDEBAR_WIDTH = sidebarCollapsed ? 64 : 280;
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
      const actualSidebarWidth = sidebarCollapsed ? 64 : Math.min(sidebarWidth, maxSidebarWidth);
      if (actualSidebarWidth !== sidebarWidth && !sidebarCollapsed) {
        setSidebarWidth(actualSidebarWidth);
        onSidebarWidthChange?.(actualSidebarWidth);
      }
      
      const availableWidth = containerWidth - actualSidebarWidth;
      
      // Default proportions for the 3 resizable columns (chat, templates, AI)
      const defaultProportions = [0.5, 0.25, 0.25];
      
      setColumnWidths(prevWidths => {
        // If we have existing widths, maintain proportions
        const currentTotal = prevWidths.reduce((a, b) => a + b, 0);
        if (currentTotal > 0) {
          const scale = availableWidth / currentTotal;
          return prevWidths.map(w => Math.max(MIN_COLUMN_WIDTH, w * scale));
        }
        
        // Otherwise use default proportions
        return defaultProportions.map(p => Math.max(MIN_COLUMN_WIDTH, availableWidth * p));
      });
    };

    calculateWidths();
    window.addEventListener('resize', calculateWidths);
    return () => window.removeEventListener('resize', calculateWidths);
  }, [sidebarWidth, sidebarCollapsed, onSidebarWidthChange]);

  // Handle resizing
  useEffect(() => {
    if (isResizing === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      
      if (isResizing === -1) {
        // Resizing sidebar
        const maxWidth = getMaxSidebarWidth();
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(mouseX, maxWidth));
        setSidebarWidth(newWidth);
        onSidebarWidthChange?.(newWidth);
      } else {
        // Resizing other columns
        const actualSidebarWidth = sidebarCollapsed ? 64 : sidebarWidth;
        const mouseXRelative = mouseX - actualSidebarWidth;
        
        setColumnWidths(prevWidths => {
          const newWidths = [...prevWidths];
          const totalWidth = containerRect.width - actualSidebarWidth;
          
          if (isResizing === 0) {
            // Resizing between chat and templates
            const newChatWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(mouseXRelative, totalWidth - MIN_COLUMN_WIDTH * 2));
            const remainingWidth = totalWidth - newChatWidth;
            const templateAIRatio = prevWidths[1] / (prevWidths[1] + prevWidths[2]);
            
            newWidths[0] = newChatWidth;
            newWidths[1] = Math.max(MIN_COLUMN_WIDTH, remainingWidth * templateAIRatio);
            newWidths[2] = Math.max(MIN_COLUMN_WIDTH, remainingWidth * (1 - templateAIRatio));
          } else if (isResizing === 1) {
            // Resizing between templates and AI
            const chatWidth = prevWidths[0];
            const templatesEndX = chatWidth + (mouseXRelative - chatWidth);
            const newTemplatesWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(templatesEndX - chatWidth, totalWidth - chatWidth - MIN_COLUMN_WIDTH));
            
            newWidths[1] = newTemplatesWidth;
            newWidths[2] = Math.max(MIN_COLUMN_WIDTH, totalWidth - chatWidth - newTemplatesWidth);
          }
          
          return newWidths;
        });
      }
    };

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

  const actualSidebarWidth = sidebarCollapsed ? 64 : sidebarWidth;

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
          onMouseDown={() => setIsResizing(-1)}
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
        onMouseDown={() => setIsResizing(0)}
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
        onMouseDown={() => setIsResizing(1)}
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