import React from 'react';
import { PremiumCalendarProvider } from '../components/Calendar/Premium/Core/PremiumCalendarProvider';
import { PremiumCalendarGrid } from '../components/Calendar/Premium/Core/PremiumCalendarGrid';
import { Star, Zap, Calendar, Users } from 'lucide-react';

interface PremiumCalendarDemoProps {
  darkMode: boolean;
}

export const PremiumCalendarDemo: React.FC<PremiumCalendarDemoProps> = ({ darkMode }) => {
  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  const handleTimeSlotClick = (date: Date, timeSlot?: any) => {
    console.log('Time slot clicked:', date, timeSlot);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Premium Calendar
                </h1>
                <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>PREMIUM</span>
                </div>
              </div>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Interfaz de calendario empresarial con características avanzadas
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div
              className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Multi-Vista
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Mes, semana, día y agenda con navegación fluida
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Multi-Calendario
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gestión avanzada de múltiples calendarios
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-purple-600" />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Eventos Inteligentes
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Detección de conflictos y sugerencias IA
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rendimiento Optimizado
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Virtualización y carga eficiente de eventos
              </p>
            </div>
          </div>
        </div>

        {/* Premium Calendar Component */}
        <div
          className={`rounded-lg shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} h-[800px]`}
        >
          <PremiumCalendarProvider initialView="month" initialDate={new Date()}>
            <PremiumCalendarGrid
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onTimeSlotClick={handleTimeSlotClick}
            />
          </PremiumCalendarProvider>
        </div>

        {/* Implementation Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              ✅ Características Implementadas
            </h3>
            <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• Vista de mes con eventos mejorados</li>
              <li>• Vista de semana con línea de tiempo</li>
              <li>• Vista de día con estadísticas detalladas</li>
              <li>• Vista de agenda con filtros avanzados</li>
              <li>• Context provider con estado completo</li>
              <li>• Detección de colisiones de eventos</li>
              <li>• Hover y selección de eventos</li>
              <li>• Indicador de tiempo actual</li>
              <li>• Diseño responsive y dark mode</li>
            </ul>
          </div>

          <div
            className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              🚧 Próximas Características
            </h3>
            <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• Drag & Drop de eventos</li>
              <li>• Integración con fotos de contactos</li>
              <li>• Plantillas de eventos</li>
              <li>• Sugerencias de programación IA</li>
              <li>• Colaboración en tiempo real</li>
              <li>• Analytics y métricas</li>
              <li>• Virtualización de rendimiento</li>
              <li>• Sistema de permisos avanzado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
