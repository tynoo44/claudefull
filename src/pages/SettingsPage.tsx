import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Palette,
  Globe,
  Shield,
  Moon,
  Sun,
  Save,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPageProps {
  darkMode: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ darkMode }) => {
  const { user } = useAuth();
  const { toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'appearance' | 'notifications' | 'integrations'
  >('profile');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'appearance' as const, label: 'Apariencia', icon: Palette },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
    { id: 'integrations' as const, label: 'Integraciones', icon: Globe },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className={`min-h-screen overflow-y-auto transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Settings className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1
              className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Configuracion
            </h1>
          </div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar tabs */}
          <nav className="sm:w-48 flex sm:flex-col gap-1 overflow-x-auto pb-2 sm:pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? darkMode
                        ? 'bg-blue-600/15 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1">
            <div
              className={`rounded-xl border p-5 sm:p-6 ${
                darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'
              }`}
            >
              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3
                      className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      Informacion personal
                    </h3>
                    <div className="flex items-center gap-4 mb-6">
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt=""
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {(fullName || user?.email)?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {fullName || 'Usuario'}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        darkMode
                          ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      } cursor-not-allowed`}
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    {saved ? 'Guardado' : 'Guardar cambios'}
                  </button>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h3
                    className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Tema
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (darkMode) toggleDarkMode();
                      }}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                        !darkMode
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Sun
                        size={24}
                        className={`mx-auto mb-2 ${!darkMode ? 'text-blue-600' : 'text-gray-400'}`}
                      />
                      <span
                        className={`text-sm font-medium ${!darkMode ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        Claro
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (!darkMode) toggleDarkMode();
                      }}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                        darkMode
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Moon
                        size={24}
                        className={`mx-auto mb-2 ${darkMode ? 'text-blue-400' : 'text-gray-500'}`}
                      />
                      <span
                        className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-gray-500'}`}
                      >
                        Oscuro
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3
                    className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Preferencias de notificacion
                  </h3>
                  {[
                    {
                      label: 'Nuevos mensajes',
                      desc: 'Recibir notificaciones de mensajes entrantes',
                      defaultOn: true,
                    },
                    {
                      label: 'Cambios de estado',
                      desc: 'Cuando un lead cambia de fase',
                      defaultOn: true,
                    },
                    {
                      label: 'Recordatorios de citas',
                      desc: 'Antes de reuniones programadas',
                      defaultOn: true,
                    },
                    {
                      label: 'Resumen diario',
                      desc: 'Recibir un resumen de actividad cada dia',
                      defaultOn: false,
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between py-3 border-b last:border-0 ${
                        darkMode ? 'border-gray-700' : 'border-gray-100'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                        >
                          {item.label}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={item.defaultOn}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-gray-600" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Integrations */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <h3
                    className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    Servicios conectados
                  </h3>
                  {[
                    {
                      name: 'Google Calendar',
                      desc: 'Sincroniza citas y eventos',
                      connected: true,
                      icon: '📅',
                    },
                    {
                      name: 'N8N Webhooks',
                      desc: 'Automatizacion de mensajes',
                      connected: true,
                      icon: '🔗',
                    },
                    {
                      name: 'Gemini AI',
                      desc: 'Asistente de conversacion con IA',
                      connected: true,
                      icon: '🤖',
                    },
                    {
                      name: 'WhatsApp Business',
                      desc: 'Mensajeria directa',
                      connected: false,
                      icon: '💬',
                    },
                  ].map(item => (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        darkMode
                          ? 'border-gray-700 bg-gray-800/30'
                          : 'border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p
                            className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {item.name}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      {item.connected ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                            darkMode
                              ? 'bg-emerald-900/30 text-emerald-400'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          <Shield size={12} />
                          Conectado
                        </span>
                      ) : (
                        <button
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                            darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          <ExternalLink size={12} />
                          Conectar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
