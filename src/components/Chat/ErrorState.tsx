import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  darkMode: boolean;
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ darkMode, error, onRetry }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full p-8 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div
        className={`max-w-md text-center p-8 rounded-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}
      >
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            darkMode ? 'bg-red-900/20' : 'bg-red-50'
          }`}
        >
          <AlertCircle className={`w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        </div>

        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Error al cargar los datos
        </h3>

        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
};
