import React, { useEffect } from 'react';
import { X, Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface MobileDrawerProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentUser?: { email: string; full_name?: string; avatar_url?: string } | null;
  onLogout: () => void;
  onToggleDarkMode: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  darkMode,
  isOpen,
  onClose,
  navItems,
  currentUser,
  onLogout,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[80vw] animate-slide-in-left flex flex-col ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="AIdeal"
              className={`h-7 w-auto ${darkMode ? '' : 'invert'}`}
            />
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              AIdeal
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {(currentUser.full_name || currentUser.email)?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {currentUser.full_name || 'Usuario'}
                </p>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentUser.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                      : 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div
          className={`p-4 border-t space-y-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <button
            onClick={onToggleDarkMode}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-sm font-medium">{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              darkMode ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Cerrar sesion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
