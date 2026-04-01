import React, { useState } from 'react';
import { Bell, Plus, X, Mail, Monitor } from 'lucide-react';

interface Reminder {
  method: 'email' | 'popup';
  minutes: number;
}

interface RemindersTabProps {
  darkMode: boolean;
  reminders: Reminder[];
  onRemindersChange: (reminders: Reminder[]) => void;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  darkMode,
  reminders,
  onRemindersChange,
}) => {
  const [newReminderMethod, setNewReminderMethod] = useState<'email' | 'popup'>('popup');
  const [newReminderMinutes, setNewReminderMinutes] = useState(15);

  const addReminder = () => {
    // Check if this reminder already exists
    if (reminders.some(r => r.method === newReminderMethod && r.minutes === newReminderMinutes)) {
      return;
    }

    const newReminder: Reminder = {
      method: newReminderMethod,
      minutes: newReminderMinutes,
    };

    onRemindersChange([...reminders, newReminder]);
  };

  const removeReminder = (index: number) => {
    onRemindersChange(reminders.filter((_, i) => i !== index));
  };

  const formatReminderTime = (minutes: number) => {
    if (minutes === 0) return 'En el momento del evento';
    if (minutes < 60) return `${minutes} minutos antes`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ${hours === 1 ? 'hora' : 'horas'} antes`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days} ${days === 1 ? 'día' : 'días'} antes`;
  };

  const getReminderIcon = (method: 'email' | 'popup') => {
    return method === 'email' ? Mail : Monitor;
  };

  const getMethodText = (method: 'email' | 'popup') => {
    return method === 'email' ? 'Email' : 'Notificación';
  };

  const presetTimes = [
    { label: 'En el momento', minutes: 0 },
    { label: '5 minutos antes', minutes: 5 },
    { label: '15 minutos antes', minutes: 15 },
    { label: '30 minutos antes', minutes: 30 },
    { label: '1 hora antes', minutes: 60 },
    { label: '2 horas antes', minutes: 120 },
    { label: '1 día antes', minutes: 1440 },
    { label: '1 semana antes', minutes: 10080 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Recordatorios
        </h3>
      </div>

      {/* Add reminder */}
      <div className="space-y-4">
        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Añadir recordatorio
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Method */}
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Método
            </label>
            <select
              value={newReminderMethod}
              onChange={e => setNewReminderMethod(e.target.value as 'email' | 'popup')}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="popup">Notificación</option>
              <option value="email">Email</option>
            </select>
          </div>

          {/* Time */}
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Tiempo
            </label>
            <select
              value={newReminderMinutes}
              onChange={e => setNewReminderMinutes(parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {presetTimes.map(preset => (
                <option key={preset.minutes} value={preset.minutes}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Add button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={addReminder}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Añadir
            </button>
          </div>
        </div>
      </div>

      {/* Current reminders */}
      {reminders.length > 0 && (
        <div>
          <h4
            className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Recordatorios configurados ({reminders.length})
          </h4>
          <div className="space-y-2">
            {reminders.map((reminder, index) => {
              const Icon = getReminderIcon(reminder.method);
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        reminder.method === 'email' ? 'text-blue-500' : 'text-green-500'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {getMethodText(reminder.method)}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatReminderTime(reminder.minutes)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReminder(index)}
                    className={`p-1 rounded-full hover:bg-red-100 hover:text-red-600 ${
                      darkMode
                        ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reminders.length === 0 && (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay recordatorios configurados</p>
          <p className="text-xs mt-1">Añade recordatorios para no olvidar este evento</p>
        </div>
      )}

      {/* Default reminders note */}
      <div
        className={`p-4 rounded-lg border-l-4 border-green-500 ${
          darkMode ? 'bg-green-900/10 border-green-400' : 'bg-green-50'
        }`}
      >
        <div className="flex">
          <div className="ml-3">
            <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
              Tip: Si no añades recordatorios, se usarán los recordatorios por defecto de tu
              calendario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
