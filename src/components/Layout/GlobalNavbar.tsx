import React, { useState } from 'react';
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
  Menu,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { MobileDrawer } from './MobileDrawer';

interface GlobalNavbarProps {
  darkMode: boolean;
  showProfileMenu: boolean;
  currentUser?: { email: string; full_name?: string; avatar_url?: string } | null;
  toggleDarkMode: () => void;
  setShowProfileMenu: (show: boolean) => void;
  logout: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/chats', label: 'Chats', icon: MessageSquare },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/templates', label: 'Plantillas', icon: FileText },
  { path: '/premium-calendar', label: 'Calendario', icon: Calendar },
  { path: '/analytics', label: 'Analiticas', icon: BarChart3 },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 safe-area-top ${
          darkMode
            ? 'bg-gray-900/95 backdrop-blur-sm border-gray-700'
            : 'bg-white/95 backdrop-blur-sm border-gray-200'
        } border-b`}
      >
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2 sm:gap-8">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 -ml-1 rounded-lg ${
                  darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Menu size={22} />
              </button>

              <h1
                className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                SetterAI
              </h1>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
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
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Search - desktop only */}
              <div className="relative hidden lg:block">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className={`pl-10 pr-4 py-2 w-40 xl:w-56 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Notifications */}
              <NotificationCenter darkMode={darkMode} />

              {/* Dark Mode Toggle - hidden on mobile (available in drawer) */}
              <button
                onClick={toggleDarkMode}
                className={`hidden sm:flex p-2 rounded-lg transition-colors ${
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
                  className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {currentUser?.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name || 'Usuario'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                  <span
                    className={`hidden md:inline text-sm font-medium ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Usuario'}
                  </span>
                  <ChevronDown size={16} className="hidden md:inline" />
                </button>

                {showProfileMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border animate-scale-in ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 rounded-t-xl ${
                        darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Settings size={16} />
                      <span>Configuracion</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 rounded-b-xl ${
                        darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileDrawer
        darkMode={darkMode}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        currentUser={currentUser}
        onLogout={logout}
        onToggleDarkMode={toggleDarkMode}
      />
    </>
  );
};
