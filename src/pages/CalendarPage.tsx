import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  MapPin,
  Phone,
  Video,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CalendarPageProps {
  darkMode: boolean;
}

// Datos de ejemplo para las citas
const sampleAppointments = [
  {
    id: '1',
    title: 'Llamada de Discovery - Juan Pérez',
    date: '2025-07-05',
    time: '10:00',
    duration: 30,
    type: 'call',
    client: 'Juan Pérez',
    status: 'confirmed',
    notes: 'Interesado en el curso de marketing digital',
  },
  {
    id: '2',
    title: 'Demo Producto - María García',
    date: '2025-07-05',
    time: '15:30',
    duration: 45,
    type: 'video',
    client: 'María García',
    status: 'pending',
    notes: 'Lead cualificado desde Instagram',
  },
  {
    id: '3',
    title: 'Follow-up - Carlos Rodríguez',
    date: '2025-07-06',
    time: '11:00',
    duration: 20,
    type: 'call',
    client: 'Carlos Rodríguez',
    status: 'confirmed',
    notes: 'Segunda llamada después del interés inicial',
  },
];

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const CalendarPage: React.FC<CalendarPageProps> = ({ darkMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  // const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Obtener el primer día del mes y calcular los días
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Crear array de días para mostrar en el calendario
  const calendarDays = [];

  // Días del mes anterior
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const prevDate = new Date(currentYear, currentMonth, -i);
    calendarDays.push({ date: prevDate, isCurrentMonth: false });
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    calendarDays.push({ date, isCurrentMonth: true });
  }

  // Días del mes siguiente para completar la grilla
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextDate = new Date(currentYear, currentMonth + 1, day);
    calendarDays.push({ date: nextDate, isCurrentMonth: false });
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sampleAppointments.filter(apt => apt.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'call':
        return <Phone className="h-3 w-3" />;
      case 'meeting':
        return <MapPin className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="inline-block mr-3 h-8 w-8" />
                Calendario de Citas
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gestiona tus citas y reuniones
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cita
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendario Principal */}
          <div className="lg:col-span-3">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              {/* Controles del Calendario */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className={`p-2 rounded-lg ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <h2
                    className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {months[currentMonth]} {currentYear}
                  </h2>

                  <button
                    onClick={() => navigateMonth('next')}
                    className={`p-2 rounded-lg ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex space-x-2">
                  {(['month', 'week', 'day'] as const).map(viewType => (
                    <button
                      key={viewType}
                      onClick={() => setView(viewType)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        view === viewType
                          ? 'bg-blue-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {viewType === 'month' ? 'Mes' : viewType === 'week' ? 'Semana' : 'Día'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grilla del Calendario */}
              <div className="grid grid-cols-7 gap-1">
                {/* Encabezado de días de la semana */}
                {daysOfWeek.map(day => (
                  <div
                    key={day}
                    className={`p-3 text-center text-sm font-medium ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {/* Días del calendario */}
                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                  const appointments = getAppointmentsForDate(date);
                  const isToday = date.toDateString() === today.toDateString();

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      } ${
                        isCurrentMonth
                          ? darkMode
                            ? 'bg-gray-800'
                            : 'bg-white'
                          : darkMode
                            ? 'bg-gray-900'
                            : 'bg-gray-50'
                      } hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} cursor-pointer transition-colors`}
                      onClick={() => console.log('Selected date:', date)}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday
                            ? 'text-blue-600'
                            : isCurrentMonth
                              ? darkMode
                                ? 'text-white'
                                : 'text-gray-900'
                              : darkMode
                                ? 'text-gray-500'
                                : 'text-gray-400'
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      {/* Citas del día */}
                      <div className="space-y-1">
                        {appointments.slice(0, 2).map(apt => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded text-white ${getStatusColor(apt.status)} flex items-center gap-1`}
                          >
                            {getTypeIcon(apt.type)}
                            <span className="truncate">{apt.time}</span>
                          </div>
                        ))}
                        {appointments.length > 2 && (
                          <div
                            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            +{appointments.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar con detalles */}
          <div className="space-y-6">
            {/* Próximas Citas */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h3
                className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Próximas Citas
              </h3>

              <div className="space-y-3">
                {sampleAppointments.slice(0, 3).map(apt => (
                  <div
                    key={apt.id}
                    className={`p-3 rounded-lg border ${
                      darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(apt.type)}
                        <span
                          className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {apt.time}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(apt.status)}`}></div>
                    </div>

                    <h4
                      className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {apt.client}
                    </h4>

                    <div className="flex items-center gap-1 mb-2">
                      <Clock
                        className={`h-3 w-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {apt.duration} min
                      </span>
                    </div>

                    {apt.notes && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {apt.notes.length > 50 ? `${apt.notes.substring(0, 50)}...` : apt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h3
                className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Esta Semana
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total de citas
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    12
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Confirmadas
                  </span>
                  <span className="font-medium text-green-500">8</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pendientes
                  </span>
                  <span className="font-medium text-yellow-500">3</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Canceladas
                  </span>
                  <span className="font-medium text-red-500">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
