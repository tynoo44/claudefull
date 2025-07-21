import React, { useState } from 'react';
import { Calendar, Star, Zap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface PremiumCalendarSimpleProps {
  darkMode: boolean;
}

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export const PremiumCalendarSimple: React.FC<PremiumCalendarSimpleProps> = ({ darkMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Datos de ejemplo para demostración
  const sampleEvents = [
    {
      id: '1',
      title: 'Reunión con cliente',
      start: new Date(2025, 0, 25, 10, 0),
      end: new Date(2025, 0, 25, 11, 0),
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'Presentación proyecto',
      start: new Date(2025, 0, 27, 14, 0),
      end: new Date(2025, 0, 27, 15, 30),
      color: '#ef4444'
    }
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1 p-4">
        {/* Headers */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className={`p-3 text-center font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map(day => {
          const dayEvents = sampleEvents.filter(event => 
            isSameDay(event.start, day)
          );

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`
                min-h-[120px] p-2 border cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20
                ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}
                ${isToday(day) ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' : ''}
                ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className={`font-medium mb-1 ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate text-white font-medium"
                    style={{ backgroundColor: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => (
    <div className={`p-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <div className="mb-4">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <h3 className="text-xl font-semibold mb-2">Vista Semanal</h3>
        <p>Vista premium de semana con timeline de horas</p>
      </div>
      <div className="grid grid-cols-7 gap-4 mt-8">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={`p-4 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="font-semibold mb-2">Día {i + 1}</div>
            <div className="text-sm opacity-75">Coming soon...</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className={`p-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <Calendar className="h-16 w-16 mx-auto mb-4 text-green-500" />
      <h3 className="text-xl font-semibold mb-2">Vista Diaria</h3>
      <p>Vista detallada del día con timeline por horas</p>
      <div className="mt-8 text-left max-w-md mx-auto">
        <div className="space-y-2">
          {sampleEvents.map(event => (
            <div key={event.id} className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="font-medium">{event.title}</div>
              <div className="text-sm opacity-75">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAgendaView = () => (
    <div className={`p-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <Calendar className="h-16 w-16 mx-auto mb-4 text-purple-500" />
      <h3 className="text-xl font-semibold mb-2">Vista Agenda</h3>
      <p>Lista cronológica de todos los eventos</p>
      <div className="mt-8 text-left max-w-lg mx-auto space-y-3">
        {sampleEvents.map(event => (
          <div key={event.id} className={`p-4 rounded-lg border-l-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} 
               style={{ borderLeftColor: event.color }}>
            <div className="font-semibold">{event.title}</div>
            <div className="text-sm opacity-75 mt-1">
              {format(event.start, 'dd MMM yyyy, HH:mm', { locale: es })} - {format(event.end, 'HH:mm')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
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
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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

            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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

            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-purple-600" />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Drag & Drop
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Mover eventos arrastrando y soltando
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  UI Premium
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Diseño profesional y responsive
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Interface */}
        <div className={`rounded-lg shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Calendar Header */}
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${darkMode ? 'text-white' : 'text-gray-700'}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${darkMode ? 'text-white' : 'text-gray-700'}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* View Selector */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { key: 'month', label: 'Mes' },
                  { key: 'week', label: 'Semana' },
                  { key: 'day', label: 'Día' },
                  { key: 'agenda', label: 'Agenda' }
                ].map(view => (
                  <button
                    key={view.key}
                    onClick={() => setCurrentView(view.key as ViewType)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      currentView === view.key
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="min-h-[600px]">
            {renderCurrentView()}
          </div>
        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ✅ Nueva interfaz premium implementada • Vista actual: <span className="font-semibold">{currentView}</span>
          </p>
        </div>
      </div>
    </div>
  );
};