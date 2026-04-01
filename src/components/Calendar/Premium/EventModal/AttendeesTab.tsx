import React, { useState } from 'react';
import { Users, Plus, X, Mail } from 'lucide-react';

interface Attendee {
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

interface AttendeesTabProps {
  darkMode: boolean;
  attendees: Attendee[];
  onAttendeesChange: (attendees: Attendee[]) => void;
}

export const AttendeesTab: React.FC<AttendeesTabProps> = ({
  darkMode,
  attendees,
  onAttendeesChange,
}) => {
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');

  const addAttendee = () => {
    if (!newAttendeeEmail.trim()) return;

    // Check if attendee already exists
    if (attendees.some(a => a.email === newAttendeeEmail.trim())) {
      return;
    }

    const newAttendee: Attendee = {
      email: newAttendeeEmail.trim(),
      status: 'pending',
    };

    onAttendeesChange([...attendees, newAttendee]);
    setNewAttendeeEmail('');
  };

  const removeAttendee = (email: string) => {
    onAttendeesChange(attendees.filter(a => a.email !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAttendee();
    }
  };

  const getStatusColor = (status: Attendee['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Attendee['status']) => {
    switch (status) {
      case 'accepted':
        return 'Confirmado';
      case 'declined':
        return 'Rechazado';
      case 'tentative':
        return 'Tentativo';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Invitados
        </h3>
      </div>

      {/* Add attendee */}
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Añadir invitados
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="nombre@ejemplo.com"
              value={newAttendeeEmail}
              onChange={e => setNewAttendeeEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={addAttendee}
            disabled={!newAttendeeEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>
      </div>

      {/* Attendees list */}
      {attendees.length > 0 && (
        <div>
          <h4
            className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Invitados ({attendees.length})
          </h4>
          <div className="space-y-2">
            {attendees.map(attendee => (
              <div
                key={attendee.email}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {attendee.name?.charAt(0) || attendee.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {attendee.name || attendee.email}
                    </p>
                    {attendee.name && (
                      <p
                        className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {attendee.email}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      darkMode
                        ? 'bg-gray-600 text-gray-300 border-gray-500'
                        : getStatusColor(attendee.status)
                    }`}
                  >
                    {getStatusText(attendee.status)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttendee(attendee.email)}
                  className={`ml-3 p-1 rounded-full hover:bg-red-100 hover:text-red-600 ${
                    darkMode
                      ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {attendees.length === 0 && (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay invitados añadidos</p>
          <p className="text-xs mt-1">Añade direcciones de email arriba para invitar personas</p>
        </div>
      )}

      {/* Send invitations note */}
      {attendees.length > 0 && (
        <div
          className={`p-4 rounded-lg border-l-4 border-blue-500 ${
            darkMode ? 'bg-blue-900/10 border-blue-400' : 'bg-blue-50'
          }`}
        >
          <div className="flex">
            <div className="ml-3">
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Las invitaciones se enviarán automáticamente cuando guardes el evento.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
