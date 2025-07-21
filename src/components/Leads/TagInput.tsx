import React, { useState, useRef, useEffect } from 'react';
import { X, Hash, Plus } from 'lucide-react';
import { useAllTags } from '../../hooks/useAllTags';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  darkMode: boolean;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  darkMode,
  placeholder = 'Agregar etiqueta...'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { data: allTags = [] } = useAllTags();
  
  // Filter suggestions based on input
  const suggestions = allTags
    .filter(({ tag }) => 
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag) &&
      inputValue.length > 0
    )
    .slice(0, 10); // Limit to 10 suggestions
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Validate tag (max 4 words)
    const words = trimmedTag.split(/\s+/);
    if (words.length > 4) {
      alert('Las etiquetas deben tener máximo 4 palabras');
      return;
    }
    
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        addTag(suggestions[selectedSuggestionIndex].tag);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };
  
  return (
    <div className="space-y-2">
      {/* Current tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Hash className="w-3 h-3" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className={`ml-1 hover:opacity-70 transition-opacity ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      
      {/* Tag input */}
      <div className="relative">
        <div className="relative">
          <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setSelectedSuggestionIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={() => inputValue.trim() && addTag(inputValue)}
            disabled={!inputValue.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
              inputValue.trim()
                ? darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : darkMode
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={`absolute top-full mt-1 w-full z-50 rounded-lg shadow-lg border overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map(({ tag, usage_count }, index) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  className={`w-full px-4 py-2 text-left flex items-center justify-between transition-colors ${
                    index === selectedSuggestionIndex
                      ? darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                      : darkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex items-center gap-2 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                  <span className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {usage_count} uso{usage_count !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Las etiquetas deben tener máximo 4 palabras. Se preferirán las etiquetas existentes.
      </p>
    </div>
  );
};