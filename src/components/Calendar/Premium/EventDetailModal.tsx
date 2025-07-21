import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Video,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Bell,
} from 'lucide-react';

interface EventDetailModalProps {
  event: any;
  calendars: Array<{ id: string; name: string; color: string }>;
  onClose: () => void;
  onEdit?: (event: any) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: any) => void;
  darkMode: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  calendars,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  darkMode,
}) => {
  if (!event) return null;

  const calendar = calendars.find(cal => cal.id === event.calendarId);
  const eventColor = calendar?.color || '#3b82f6';

  const formatDateTime = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy • HH:mm", { locale: es });
  };

  const getEventTypeIcon = () => {
    if (event.meetingLink) return <Video className="h-5 w-5" />;
    if (event.type === 'meeting') return <Users className="h-5 w-5" />;
    if (event.type === 'reminder') return <Bell className="h-5 w-5" />;
    return <Calendar className="h-5 w-5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-lg rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
              >
                {getEventTypeIcon()}
              </div>
              <div>
                <h2
                  className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {event.title}
                </h2>
                {calendar && (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventColor }} />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {calendar.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date and Time */}
          <div className="flex items-start space-x-3">
            <Clock className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
              {event.isAllDay ? (
                <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                  Todo el día •{' '}
                  {format(new Date(event.start), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              ) : (
                <>
                  <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                    {formatDateTime(new Date(event.start))}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    hasta {formatDateTime(new Date(event.end))}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start space-x-3">
              <MapPin
                className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              />
              <div>
                <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{event.location}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-sm flex items-center space-x-1 mt-1"
                >
                  <span>Ver en Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Meeting Link */}
          {event.meetingLink && (
            <div className="flex items-start space-x-3">
              <Video className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex items-center space-x-1"
                >
                  <span>Unirse a la videollamada</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start space-x-3">
              <Users className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div className="flex-1">
                <p className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {event.attendees.length} asistente{event.attendees.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {event.attendees.map((attendee: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {(attendee.name || attendee.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {attendee.name || attendee.email}
                        </p>
                        {attendee.name && (
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {attendee.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          attendee.status === 'accepted'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : attendee.status === 'declined'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {attendee.status === 'accepted'
                          ? 'Asistirá'
                          : attendee.status === 'declined'
                            ? 'No asistirá'
                            : attendee.status === 'tentative'
                              ? 'Tal vez'
                              : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start space-x-3">
              <FileText
                className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              />
              <div className="flex-1">
                <p
                  className={`whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                >
                  {event.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className={`p-4 border-t ${
            darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          } flex items-center justify-between`}
        >
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar</span>
              </button>
            )}

            {onDuplicate && (
              <button
                onClick={() => onDuplicate(event)}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Copy className="h-4 w-4" />
                <span>Duplicar</span>
              </button>
            )}
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="px-3 py-2 rounded-lg flex items-center space-x-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
