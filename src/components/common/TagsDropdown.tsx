import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Tag, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTags } from '@/hooks/useTags';

interface TagsDropdownProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  leadId?: string;
  showAddNew?: boolean;
  className?: string;
}

export function TagsDropdown({
  selectedTags,
  onToggleTag,
  onClearTags,
  leadId,
  showAddNew = false,
  className,
}: TagsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { tags, isLoading, addTag } = useTags();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewTag = () => {
    if (newTag.trim() && leadId) {
      addTag({ leadId, tag: newTag.trim() });
      setNewTag('');
      setShowNewTagInput(false);
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Filtrar por tags'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md text-xs"
            >
              {tag}
              <button
                onClick={() => onToggleTag(tag)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearTags}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                Cargando tags...
              </div>
            ) : tags.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay tags disponibles
              </div>
            ) : (
              <div className="p-2">
                {tags.map(({ tag, count }) => (
                  <label
                    key={tag}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => onToggleTag(tag)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({count})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {showAddNew && leadId && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              {showNewTagInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddNewTag()}
                    placeholder="Nuevo tag..."
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    autoFocus
                  />
                  <button
                    onClick={handleAddNewTag}
                    disabled={!newTag.trim()}
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Añadir
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTag('');
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTagInput(true)}
                  className="flex items-center gap-2 w-full p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <Plus className="w-4 h-4" />
                  Añadir nuevo tag
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
