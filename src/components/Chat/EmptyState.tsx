import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';

interface EmptyStateProps {
  darkMode: boolean;
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  darkMode,
  title,
  description,
  icon,
  action
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {icon || (
            <MessageSquare className={`w-10 h-10 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
          )}
        </div>
        
        <h3 className={`text-lg font-semibold mb-2 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h3>
        
        <p className={`text-sm mb-6 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {description}
        </p>
        
        {action && (
          <button
            onClick={action.onClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};