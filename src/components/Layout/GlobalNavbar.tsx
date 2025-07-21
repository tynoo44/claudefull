import React from 'react';
import {
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Search,
  Home,
  Calendar,
  FileText,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter } from '../Notifications/NotificationCenter';

interface GlobalNavbarProps {
  darkMode: boolean;
  showProfileMenu: boolean;
  currentUser?: { email: string; full_name?: string; avatar_url?: string } | null;
  toggleDarkMode: () => void;
  setShowProfileMenu: (show: boolean) => void;
  logout: () => void;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({
  darkMode,
  showProfileMenu,
  currentUser,
  toggleDarkMode,
  setShowProfileMenu,
  logout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/chats', label: 'Chats', icon: MessageSquare },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/templates', label: 'Plantillas', icon: FileText },
    { path: '/premium-calendar', label: 'Calendario', icon: Calendar },
    { path: '/analytics', label: 'Analíticas', icon: BarChart3 },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      } border-b px-6 py-3`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            SetterAI
          </h1>

          {/* Navigation Items */}
          <div className="hidden md:flex space-x-6">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
            <input
              type="text"
              placeholder="Buscar..."
              className={`pl-10 pr-4 py-2 w-64 rounded-lg border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Notifications */}
          <NotificationCenter darkMode={darkMode} />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name || 'Usuario'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
              <span
                className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
              >
                {currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Usuario'}
              </span>
              <ChevronDown size={16} />
            </button>

            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
