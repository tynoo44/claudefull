import React from 'react';
import { MapPin, Video, Calendar } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  location: string;
  calendarId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  meetingLink: string;
  visibility: 'default' | 'public' | 'private';
}

interface BasicInfoTabProps {
  darkMode: boolean;
  formData: FormData;
  calendars: Array<{ id: string; name: string; color: string; visible: boolean }>;
  onFormChange: (updates: Partial<FormData>) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  darkMode,
  formData,
  calendars,
  onFormChange,
}) => {
  const toggleAllDay = () => {
    onFormChange({ isAllDay: !formData.isAllDay });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Título del evento *
        </label>
        <input
          type="text"
          placeholder="Título del evento"
          value={formData.title}
          onChange={e => onFormChange({ title: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          required
        />
      </div>

      {/* Calendar Selection */}
      <div>
        <label
          className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendario
        </label>
        <select
          value={formData.calendarId}
          onChange={e => onFormChange({ calendarId: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          required
        >
          <option value="">Selecciona un calendario</option>
          {calendars
            .filter(cal => cal.visible)
            .map(calendar => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.name}
              </option>
            ))}
        </select>
      </div>

      {/* All-day toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="allDay"
          checked={formData.isAllDay}
          onChange={toggleAllDay}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="allDay"
          className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Todo el día
        </label>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Fecha de inicio
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={e => onFormChange({ startDate: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
          />
        </div>

        {!formData.isAllDay && (
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Hora de inicio
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => onFormChange({ startTime: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Fecha de fin
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={e => onFormChange({ endDate: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
          />
        </div>

        {!formData.isAllDay && (
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Hora de fin
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => onFormChange({ endTime: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Descripción
        </label>
        <textarea
          placeholder="Añade una descripción..."
          value={formData.description}
          onChange={e => onFormChange({ description: e.target.value })}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Location */}
      <div>
        <label
          className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Ubicación
        </label>
        <input
          type="text"
          placeholder="Añade una ubicación"
          value={formData.location}
          onChange={e => onFormChange({ location: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Meeting Link */}
      <div>
        <label
          className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          <Video className="w-4 h-4" />
          Enlace de reunión
        </label>
        <input
          type="url"
          placeholder="https://meet.google.com/..."
          value={formData.meetingLink}
          onChange={e => onFormChange({ meetingLink: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Visibility */}
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Visibilidad
        </label>
        <select
          value={formData.visibility}
          onChange={e => onFormChange({ visibility: e.target.value as any })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="default">Por defecto</option>
          <option value="public">Público</option>
          <option value="private">Privado</option>
        </select>
      </div>
    </div>
  );
};