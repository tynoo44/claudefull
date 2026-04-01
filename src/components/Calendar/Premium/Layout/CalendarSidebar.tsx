import React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface CalendarSidebarProps {
  darkMode: boolean;
  currentDate: Date;
  selectedDate: Date | null;
  calendars: CalendarInfo[];
  todayEventsCount: number;
  weekEventsCount: number;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onCalendarToggle: (calendar: CalendarInfo) => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  darkMode,
  currentDate,
  selectedDate,
  calendars,
  todayEventsCount,
  weekEventsCount,
  onDateSelect,
  onMonthChange,
  onCalendarToggle,
}) => {
  const handleDateClick = (day: Date) => {
    onDateSelect(day);
    // Load month if clicking on a different month
    if (!isSameMonth(day, currentDate)) {
      onMonthChange(day);
    }
  };

  return (
    <div
      className={`w-64 border-r ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      } p-4 space-y-4`}
    >
      {/* Mini calendar */}
      <div>
        <h3
          className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
        >
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
            <div
              key={day}
              className={`text-center p-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {day}
            </div>
          ))}
          {eachDayOfInterval({
            start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
            end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
          }).map(day => (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`p-1 text-center rounded hover:bg-blue-100 dark:hover:bg-blue-900 ${
                isToday(day)
                  ? 'bg-blue-600 text-white'
                  : isSameMonth(day, currentDate)
                    ? darkMode
                      ? 'text-gray-200'
                      : 'text-gray-900'
                    : darkMode
                      ? 'text-gray-600'
                      : 'text-gray-400'
              } ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}`}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      </div>

      {/* Calendars list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Mis calendarios
          </h3>
          <button
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {calendars.map(calendar => (
            <div key={calendar.id} className="flex items-center space-x-3 group">
              <button onClick={() => onCalendarToggle(calendar)} className="flex-shrink-0">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    calendar.visible ? '' : 'bg-transparent'
                  }`}
                  style={{
                    backgroundColor: calendar.visible ? calendar.color : 'transparent',
                    borderColor: calendar.color,
                  }}
                />
              </button>
              <span
                className={`flex-1 text-sm ${
                  calendar.visible
                    ? darkMode
                      ? 'text-gray-200'
                      : 'text-gray-900'
                    : darkMode
                      ? 'text-gray-500'
                      : 'text-gray-400'
                }`}
              >
                {calendar.name}
              </span>
              <button
                className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h4
          className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
        >
          ESTADÍSTICAS
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Eventos hoy</span>
            <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{todayEventsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Esta semana</span>
            <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{weekEventsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
