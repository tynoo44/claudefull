import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import {
  X,
  Clock,
  MapPin,
  Users,
  Video,
  Calendar,
  Bell,
  Repeat,
  Type,
  AlignLeft,
  Save,
  Trash2,
  Copy,
  Globe,
} from 'lucide-react';
import { GoogleCalendarService } from '../../../lib/google-calendar';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendars: Array<{ id: string; name: string; color: string; visible: boolean }>;
  selectedDate?: Date;
  selectedHour?: number;
  existingEvent?: any;
  darkMode: boolean;
  onEventCreated: (event: any) => void;
  onEventUpdated: (event: any) => void;
  onEventDeleted: (eventId: string) => void;
}

interface EventFormData {
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
  attendees: Array<{
    email: string;
    name?: string;
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;
  reminders: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: string;
    count?: number;
  };
  visibility: 'default' | 'public' | 'private';
}

export const EventCreateModal: React.FC<EventCreateModalProps> = ({
  isOpen,
  onClose,
  calendars,
  selectedDate,
  selectedHour,
  existingEvent,
  darkMode,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    calendarId: calendars.find(cal => cal.visible)?.id || '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
    meetingLink: '',
    attendees: [],
    reminders: [{ method: 'popup', minutes: 10 }],
    visibility: 'default',
  });

  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'reminders'>('details');

  const isEditMode = !!existingEvent;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        // Edit mode - populate with existing event data
        const start = new Date(existingEvent.start);
        const end = new Date(existingEvent.end);

        setFormData({
          title: existingEvent.title || '',
          description: existingEvent.description || '',
          location: existingEvent.location || '',
          calendarId: existingEvent.calendarId || calendars.find(cal => cal.visible)?.id || '',
          startDate: format(start, 'yyyy-MM-dd'),
          startTime: existingEvent.isAllDay ? '' : format(start, 'HH:mm'),
          endDate: format(end, 'yyyy-MM-dd'),
          endTime: existingEvent.isAllDay ? '' : format(end, 'HH:mm'),
          isAllDay: existingEvent.isAllDay || false,
          meetingLink: existingEvent.meetingLink || '',
          attendees: existingEvent.attendees || [],
          reminders: [{ method: 'popup', minutes: 10 }],
          visibility: 'default',
        });
      } else {
        // Create mode - initialize with selected date/time
        const defaultStartDate = selectedDate || new Date();
        const defaultStartTime =
          selectedHour !== undefined ? selectedHour : defaultStartDate.getHours();
        const startDateTime = new Date(defaultStartDate);
        startDateTime.setHours(defaultStartTime, 0, 0, 0);
        const endDateTime = addHours(startDateTime, 1);

        setFormData({
          title: '',
          description: '',
          location: '',
          calendarId: calendars.find(cal => cal.visible)?.id || '',
          startDate: format(startDateTime, 'yyyy-MM-dd'),
          startTime: format(startDateTime, 'HH:mm'),
          endDate: format(endDateTime, 'yyyy-MM-dd'),
          endTime: format(endDateTime, 'HH:mm'),
          isAllDay: false,
          meetingLink: '',
          attendees: [],
          reminders: [{ method: 'popup', minutes: 10 }],
          visibility: 'default',
        });
      }
      setError(null);
      setActiveTab('details');
    }
  }, [isOpen, existingEvent, selectedDate, selectedHour, calendars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('El título del evento es obligatorio');
      return;
    }

    if (!formData.calendarId) {
      setError('Debe seleccionar un calendario');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const calendarService = new GoogleCalendarService();

      // Prepare event data for Google Calendar API
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_datetime: formData.isAllDay
          ? startOfDay(new Date(`${formData.startDate}T00:00:00`)).toISOString()
          : new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString(),
        end_datetime: formData.isAllDay
          ? startOfDay(new Date(`${formData.endDate}T23:59:59`)).toISOString()
          : new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString(),
        is_all_day: formData.isAllDay,
        meeting_link: formData.meetingLink,
        attendees: formData.attendees.map(att => ({
          email: att.email,
          display_name: att.name || att.email,
        })),
      };

      let result;
      if (isEditMode) {
        // Update existing event
        result = await calendarService.updateEvent(
          formData.calendarId,
          existingEvent.id,
          eventData,
        );
        onEventUpdated({
          ...existingEvent,
          ...eventData,
          start: new Date(eventData.start_datetime),
          end: new Date(eventData.end_datetime),
          calendarId: formData.calendarId,
        });
      } else {
        // Create new event
        result = await calendarService.createEvent(formData.calendarId, eventData);
        onEventCreated({
          id: result.id || `temp-${Date.now()}`,
          title: eventData.title,
          start: new Date(eventData.start_datetime),
          end: new Date(eventData.end_datetime),
          description: eventData.description,
          location: eventData.location,
          calendarId: formData.calendarId,
          calendarName: calendars.find(cal => cal.id === formData.calendarId)?.name || 'Unknown',
          color: calendars.find(cal => cal.id === formData.calendarId)?.color || '#3b82f6',
          isAllDay: eventData.is_all_day,
          meetingLink: eventData.meeting_link,
          attendees: formData.attendees,
          type: 'meeting' as const,
          priority: 'medium' as const,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el evento. Inténtalo de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    setIsLoading(true);
    try {
      const calendarService = new GoogleCalendarService();
      await calendarService.deleteEvent(formData.calendarId, existingEvent.id);
      onEventDeleted(existingEvent.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Error al eliminar el evento. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const addAttendee = () => {
    if (newAttendeeEmail.trim() && newAttendeeEmail.includes('@')) {
      setFormData(prev => ({
        ...prev,
        attendees: [
          ...prev.attendees,
          {
            email: newAttendeeEmail.trim(),
            status: 'pending' as const,
          },
        ],
      }));
      setNewAttendeeEmail('');
    }
  };

  const removeAttendee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
    }));
  };

  const toggleAllDay = () => {
    setFormData(prev => ({
      ...prev,
      isAllDay: !prev.isAllDay,
      startTime: !prev.isAllDay ? '' : '09:00',
      endTime: !prev.isAllDay ? '' : '10:00',
    }));
  };

  if (!isOpen) return null;

  const selectedCalendar = calendars.find(cal => cal.id === formData.calendarId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: selectedCalendar?.color || '#3b82f6' }}
              >
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEditMode ? 'Editar evento' : 'Nuevo evento'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedCalendar?.name || 'Selecciona un calendario'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {[
              { key: 'details', label: 'Detalles', icon: Type },
              { key: 'attendees', label: 'Asistentes', icon: Users },
              { key: 'reminders', label: 'Recordatorios', icon: Bell },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto"
        >
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
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
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Añadir título"
                  required
                />
              </div>

              {/* Calendar Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Calendario
                </label>
                <select
                  value={formData.calendarId}
                  onChange={e => setFormData(prev => ({ ...prev, calendarId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
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
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
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
                      onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                )}

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
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
                      onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
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
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={3}
                  placeholder="Añadir descripción"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Ubicación
                </label>
                <div className="relative">
                  <MapPin
                    className={`absolute left-3 top-3 h-4 w-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Añadir ubicación"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Enlace de videollamada
                </label>
                <div className="relative">
                  <Video
                    className={`absolute left-3 top-3 h-4 w-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={e => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="space-y-4">
              {/* Add attendee */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Añadir asistentes
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newAttendeeEmail}
                    onChange={e => setNewAttendeeEmail(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="email@ejemplo.com"
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                  />
                  <button
                    type="button"
                    onClick={addAttendee}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {/* Attendees list */}
              {formData.attendees.length > 0 && (
                <div>
                  <h4
                    className={`text-sm font-medium mb-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Asistentes ({formData.attendees.length})
                  </h4>
                  <div className="space-y-2">
                    {formData.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {attendee.name || attendee.email}
                            </p>
                            {attendee.name && (
                              <p
                                className={`text-xs ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                {attendee.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttendee(index)}
                          className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div>
                <h4
                  className={`text-sm font-medium mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Recordatorios
                </h4>
                <div className="space-y-3">
                  {formData.reminders.map((reminder, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <Bell className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notificación {reminder.minutes} minutos antes
                      </span>
                    </div>
                  ))}
                </div>
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
                  onChange={e =>
                    setFormData(prev => ({ ...prev, visibility: e.target.value as any }))
                  }
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
          )}
        </form>

        {/* Footer */}
        <div
          className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}
        >
          <div className="flex space-x-3">
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear evento'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
