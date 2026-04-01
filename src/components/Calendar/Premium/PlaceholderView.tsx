import React from 'react';
import { Calendar, Zap, Users, Shield, Globe, RefreshCw } from 'lucide-react';

interface PlaceholderViewProps {
  currentView: string;
  darkMode: boolean;
  isLoading: boolean;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  currentView,
  darkMode,
  isLoading,
}) => {
  const features = [
    { icon: Zap, label: 'Rápido', desc: 'Carga instantánea' },
    { icon: Users, label: 'Colaborativo', desc: 'Trabajo en equipo' },
    { icon: Shield, label: 'Seguro', desc: 'Datos protegidos' },
    { icon: Globe, label: 'Sincronizado', desc: 'Multi-dispositivo' },
  ];

  return (
    <div className="text-center py-20">
      <Calendar
        className={`h-24 w-24 mx-auto mb-6 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
      />
      <h3 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        Vista {currentView} próximamente
      </h3>
      <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Estamos trabajando en esta vista...
      </p>

      {isLoading && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
            Cargando Google Calendar...
          </span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}
            >
              <Icon
                className={`h-8 w-8 mx-auto mb-2 ${
                  ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500'][index]
                }`}
              />
              <h4
                className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
              >
                {feature.label}
              </h4>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
