import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import { X, Save, Trash2, Type, Users, Bell } from 'lucide-react';
import { GoogleCalendarService } from '../../../lib/google-calendar';

// Tab components
import { BasicInfoTab } from './EventModal/BasicInfoTab';
import { AttendeesTab } from './EventModal/AttendeesTab';
import { RemindersTab } from './EventModal/RemindersTab';

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

type TabType = 'basic' | 'attendees' | 'reminders';

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
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    calendarId: calendars.find(cal => cal.visible)?.id || '',
    startDate: format(selectedDate || new Date(), 'yyyy-MM-dd'),
    startTime: selectedHour
      ? format(addHours(startOfDay(new Date()), selectedHour), 'HH:mm')
      : '09:00',
    endDate: format(selectedDate || new Date(), 'yyyy-MM-dd'),
    endTime: selectedHour
      ? format(addHours(startOfDay(new Date()), selectedHour + 1), 'HH:mm')
      : '10:00',
    isAllDay: false,
    meetingLink: '',
    attendees: [],
    reminders: [{ method: 'popup', minutes: 15 }],
    visibility: 'default',
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        // Populate with existing event data
        setFormData({
          title: existingEvent.title || '',
          description: existingEvent.description || '',
          location: existingEvent.location || '',
          calendarId: existingEvent.calendarId || calendars.find(cal => cal.visible)?.id || '',
          startDate: format(existingEvent.start, 'yyyy-MM-dd'),
          startTime: existingEvent.isAllDay ? '00:00' : format(existingEvent.start, 'HH:mm'),
          endDate: format(existingEvent.end, 'yyyy-MM-dd'),
          endTime: existingEvent.isAllDay ? '23:59' : format(existingEvent.end, 'HH:mm'),
          isAllDay: existingEvent.isAllDay || false,
          meetingLink: existingEvent.meetingLink || '',
          attendees: existingEvent.attendees || [],
          reminders: [{ method: 'popup', minutes: 15 }],
          visibility: 'default',
        });
      } else {
        // Reset for new event
        setFormData({
          title: '',
          description: '',
          location: '',
          calendarId: calendars.find(cal => cal.visible)?.id || '',
          startDate: format(selectedDate || new Date(), 'yyyy-MM-dd'),
          startTime: selectedHour
            ? format(addHours(startOfDay(new Date()), selectedHour), 'HH:mm')
            : '09:00',
          endDate: format(selectedDate || new Date(), 'yyyy-MM-dd'),
          endTime: selectedHour
            ? format(addHours(startOfDay(new Date()), selectedHour + 1), 'HH:mm')
            : '10:00',
          isAllDay: false,
          meetingLink: '',
          attendees: [],
          reminders: [{ method: 'popup', minutes: 15 }],
          visibility: 'default',
        });
      }
      setActiveTab('basic');
      setError(null);
    }
  }, [isOpen, existingEvent, calendars, selectedDate, selectedHour]);

  const handleFormChange = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.calendarId) {
      setError('Por favor, completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const calendarService = new GoogleCalendarService();

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_datetime: formData.isAllDay
          ? `${formData.startDate}T00:00:00`
          : `${formData.startDate}T${formData.startTime}:00`,
        end_datetime: formData.isAllDay
          ? `${formData.endDate}T23:59:59`
          : `${formData.endDate}T${formData.endTime}:00`,
        is_all_day: formData.isAllDay,
        meeting_link: formData.meetingLink,
        attendees: formData.attendees.map(a => ({ email: a.email, display_name: a.name })),
        reminders: formData.reminders,
        visibility: formData.visibility,
      };

      if (existingEvent) {
        // Update existing event
        const updatedEvent = await calendarService.updateEvent(
          formData.calendarId,
          existingEvent.id,
          { ...eventData, id: existingEvent.id },
        );
        onEventUpdated(updatedEvent);
      } else {
        // Create new event
        const newEvent = await calendarService.createEvent(formData.calendarId, eventData);
        onEventCreated(newEvent);
      }

      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Error al guardar el evento. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

    setIsLoading(true);
    try {
      const calendarService = new GoogleCalendarService();
      await calendarService.deleteEvent(existingEvent.calendarId, existingEvent.id);
      onEventDeleted(existingEvent.id);
      onClose();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Error al eliminar el evento.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as const, label: 'Detalles', icon: Type },
    { id: 'attendees' as const, label: 'Invitados', icon: Users },
    { id: 'reminders' as const, label: 'Recordatorios', icon: Bell },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div
          className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between p-6 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {existingEvent ? 'Editar evento' : 'Crear evento'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tabs */}
            <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : darkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'basic' && (
                <BasicInfoTab
                  darkMode={darkMode}
                  formData={formData}
                  calendars={calendars}
                  onFormChange={handleFormChange}
                />
              )}
              {activeTab === 'attendees' && (
                <AttendeesTab
                  darkMode={darkMode}
                  attendees={formData.attendees}
                  onAttendeesChange={attendees => handleFormChange({ attendees })}
                />
              )}
              {activeTab === 'reminders' && (
                <RemindersTab
                  darkMode={darkMode}
                  reminders={formData.reminders}
                  onRemindersChange={reminders => handleFormChange({ reminders })}
                />
              )}
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-t ${
                darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {existingEvent && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.title.trim() || !formData.calendarId}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {existingEvent ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {existingEvent ? 'Actualizar evento' : 'Crear evento'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
