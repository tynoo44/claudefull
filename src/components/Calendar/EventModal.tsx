import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Save, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type {
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  GoogleCalendar,
} from '../../types/calendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => void;
  onDelete?: (eventId: string) => void;
  event?: CalendarEvent;
  calendars: GoogleCalendar[];
  darkMode: boolean;
  defaultDate?: Date;
  defaultCalendarId?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  calendars,
  darkMode,
  defaultDate,
  defaultCalendarId,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_datetime: '',
    end_datetime: '',
    is_all_day: false,
    google_calendar_id: '',
    attendees: [] as { email: string; display_name?: string }[],
    reminders: [{ method: 'popup' as const, minutes: 15 }],
  });

  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (event) {
      // Editing existing event
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        start_datetime: event.start_datetime.slice(0, 16), // Format for datetime-local input
        end_datetime: event.end_datetime.slice(0, 16),
        is_all_day: event.is_all_day,
        google_calendar_id: event.google_calendar_id,
        attendees: event.attendees.map(att => ({
          email: att.email,
          display_name: att.display_name,
        })),
        reminders: event.reminders,
      });
    } else {
      // Creating new event
      const now = new Date();
      const start = defaultDate || now;
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      setFormData({
        title: '',
        description: '',
        location: '',
        start_datetime: format(start, "yyyy-MM-dd'T'HH:mm"),
        end_datetime: format(end, "yyyy-MM-dd'T'HH:mm"),
        is_all_day: false,
        google_calendar_id: defaultCalendarId || calendars[0]?.id || '',
        attendees: [],
        reminders: [{ method: 'popup', minutes: 15 }],
      });
    }
  }, [event, defaultDate, defaultCalendarId, calendars]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAllDayToggle = (isAllDay: boolean) => {
    if (isAllDay) {
      // Convert to all-day format
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);

      setFormData(prev => ({
        ...prev,
        is_all_day: true,
        start_datetime: format(startDate, "yyyy-MM-dd'T'00:00"),
        end_datetime: format(endDate, "yyyy-MM-dd'T'23:59"),
      }));
    } else {
      setFormData(prev => ({ ...prev, is_all_day: false }));
    }
  };

  const addAttendee = () => {
    if (newAttendeeEmail && !formData.attendees.find(att => att.email === newAttendeeEmail)) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, { email: newAttendeeEmail }],
      }));
      setNewAttendeeEmail('');
    }
  };

  const removeAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(att => att.email !== email),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.google_calendar_id) {
      newErrors.google_calendar_id = 'Debes seleccionar un calendario';
    }

    if (new Date(formData.start_datetime) >= new Date(formData.end_datetime)) {
      newErrors.end_datetime = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const eventData = {
      ...formData,
      start_datetime: new Date(formData.start_datetime).toISOString(),
      end_datetime: new Date(formData.end_datetime).toISOString(),
    };

    if (event) {
      onSave({ id: event.id, ...eventData } as UpdateEventRequest);
    } else {
      onSave(eventData as CreateEventRequest);
    }
  };

  const handleDelete = () => {
    if (event && onDelete && window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      onDelete(event.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {event ? 'Editar Evento' : 'Crear Evento'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              } ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Título del evento"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Calendario */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Calendario *
            </label>
            <select
              value={formData.google_calendar_id}
              onChange={e => handleInputChange('google_calendar_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } ${errors.google_calendar_id ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccionar calendario</option>
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
            {errors.google_calendar_id && (
              <p className="text-red-500 text-sm mt-1">{errors.google_calendar_id}</p>
            )}
          </div>

          {/* Todo el día */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="all-day"
              checked={formData.is_all_day}
              onChange={e => handleAllDayToggle(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="all-day"
              className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Todo el día
            </label>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Fecha de inicio *
              </label>
              <input
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                value={
                  formData.is_all_day
                    ? formData.start_datetime.split('T')[0]
                    : formData.start_datetime
                }
                onChange={e =>
                  handleInputChange(
                    'start_datetime',
                    formData.is_all_day ? `${e.target.value}T00:00` : e.target.value,
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Fecha de fin *
              </label>
              <input
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                value={
                  formData.is_all_day ? formData.end_datetime.split('T')[0] : formData.end_datetime
                }
                onChange={e =>
                  handleInputChange(
                    'end_datetime',
                    formData.is_all_day ? `${e.target.value}T23:59` : e.target.value,
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.end_datetime ? 'border-red-500' : ''}`}
              />
              {errors.end_datetime && (
                <p className="text-red-500 text-sm mt-1">{errors.end_datetime}</p>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Ubicación del evento"
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Descripción del evento"
            />
          </div>

          {/* Asistentes */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Asistentes
            </label>

            {/* Agregar asistente */}
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newAttendeeEmail}
                onChange={e => setNewAttendeeEmail(e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Email del asistente"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
              />
              <button
                type="button"
                onClick={addAttendee}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de asistentes */}
            {formData.attendees.length > 0 && (
              <div className="space-y-2">
                {formData.attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 border rounded ${
                      darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {attendee.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee.email)}
                      className={`text-red-500 hover:text-red-700 ${darkMode ? 'hover:text-red-400' : ''}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between pt-6">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {event ? 'Guardar Cambios' : 'Crear Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
