import React, { useState, useRef, useEffect } from 'react';
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
  { path: '/dashboard', label: 'Inicio', icon: Home },
  { path: '/chats', label: 'Chats', icon: MessageSquare },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/templates', label: 'Plantillas', icon: FileText },
  { path: '/premium-calendar', label: 'Calendario', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
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
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, setShowProfileMenu]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 safe-area-top ${
          darkMode
            ? 'bg-gray-900/95 backdrop-blur-md border-gray-800'
            : 'bg-white/95 backdrop-blur-md border-gray-200'
        } border-b`}
      >
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 -ml-1 rounded-lg transition-colors ${
                  darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Menu size={22} />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 group"
              >
                <span
                  className={`text-lg sm:text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  <span className="text-blue-500">AI</span>deal
                </span>
              </button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-0.5">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === '/dashboard' && location.pathname === '/');
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? darkMode
                            ? 'text-blue-400'
                            : 'text-blue-600'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                      }`}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search - desktop only */}
              <div className="relative hidden lg:block">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className={`pl-10 pr-4 py-1.5 w-44 xl:w-56 rounded-lg border text-sm transition-all ${
                    darkMode
                      ? 'bg-gray-800/60 border-gray-700/60 text-white placeholder-gray-500 focus:bg-gray-800 focus:border-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              {/* Notifications */}
              <NotificationCenter darkMode={darkMode} />

              {/* Dark Mode Toggle - hidden on mobile */}
              <button
                onClick={toggleDarkMode}
                className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Profile Menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {currentUser?.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name || 'Usuario'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-blue-500/30 transition-all"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
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
                  <ChevronDown
                    size={14}
                    className={`hidden md:inline transition-transform ${showProfileMenu ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                </button>

                {showProfileMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border animate-scale-in overflow-hidden ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* User info header */}
                    <div
                      className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                    >
                      <p
                        className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {currentUser?.full_name || 'Usuario'}
                      </p>
                      <p
                        className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {currentUser?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                        darkMode
                          ? 'text-gray-300 hover:bg-gray-700/60'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Settings size={16} />
                      <span>Configuraci&oacute;n</span>
                    </button>
                    <div
                      className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                    />
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                        darkMode
                          ? 'text-red-400 hover:bg-gray-700/60'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <LogOut size={16} />
                      <span>Cerrar sesi&oacute;n</span>
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
