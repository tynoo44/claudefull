import React, { useState, useRef, useEffect } from 'react';
import { Hash, ChevronRight } from 'lucide-react';

interface TagsPopoverProps {
  tags: string[];
  darkMode: boolean;
  maxVisible?: number;
}

export const TagsPopover: React.FC<TagsPopoverProps> = ({ 
  tags, 
  darkMode, 
  maxVisible = 3 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingTags = tags.slice(maxVisible);
  const hasMore = remainingTags.length > 0;

  return (
    <div className="relative inline-flex items-center gap-1 flex-wrap">
      {/* Visible tags */}
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Hash className="w-3 h-3" />
          {tag}
        </span>
      ))}
      
      {/* Show more button */}
      {hasMore && (
        <>
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            +{remainingTags.length} más
          </button>

          {/* Popover with remaining tags */}
          {isOpen && (
            <div
              ref={popoverRef}
              className={`absolute top-full mt-2 left-0 z-50 p-3 rounded-lg shadow-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              } max-w-sm w-max`}
            >
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Small arrow pointing to button */}
              <div 
                className={`absolute -top-2 left-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] ${
                  darkMode ? 'border-b-gray-800' : 'border-b-white'
                }`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};