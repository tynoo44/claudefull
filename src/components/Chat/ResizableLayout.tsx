import React, { useState, useRef, useEffect } from 'react';

interface ResizableLayoutProps {
  children: React.ReactNode[];
  minWidths?: number[];
  defaultWidths?: number[];
  darkMode: boolean;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  children,
  minWidths = [200, 400, 200, 300],
  defaultWidths = [320, 600, 320, 384],
  darkMode
}) => {
  const [widths, setWidths] = useState(defaultWidths);
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing === null || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const totalWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      const newWidths = [...widths];
      let accumulatedWidth = 0;

      for (let i = 0; i <= isResizing; i++) {
        accumulatedWidth += widths[i];
      }

      const newWidth = mouseX - (accumulatedWidth - widths[isResizing]);
      
      if (newWidth >= minWidths[isResizing] && newWidth <= totalWidth - minWidths[isResizing + 1] - accumulatedWidth + widths[isResizing]) {
        newWidths[isResizing] = newWidth;
        
        // Adjust the next panel
        const remainingWidth = totalWidth - newWidths.slice(0, isResizing + 1).reduce((a, b) => a + b, 0);
        const remainingPanels = newWidths.length - isResizing - 1;
        
        if (remainingPanels > 0) {
          const widthPerPanel = remainingWidth / remainingPanels;
          for (let i = isResizing + 1; i < newWidths.length; i++) {
            newWidths[i] = Math.max(widthPerPanel, minWidths[i]);
          }
        }
        
        setWidths(newWidths);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, widths, minWidths]);

  return (
    <div ref={containerRef} className="flex h-full relative">
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div 
            style={{ 
              width: `${widths[index]}px`,
              minWidth: `${minWidths[index]}px`,
              flexShrink: 0
            }}
            className="relative overflow-hidden"
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={`w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${
                isResizing === index ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}
              onMouseDown={() => setIsResizing(index)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};