import React from 'react';
import { Bell, X, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

interface NotificationCenterProps {
  darkMode: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ darkMode }) => {
  const {
    notifications,
    unreadCount,
    isVisible,
    activeToasts,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    hideNotifications,
    showNotifications,
    removeToast,
    hasUnread
  } = useRealtimeNotifications();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const truncateMessage = (text: string, maxLength = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      {/* Bell Icon Button */}
      <div className="relative">
        <button
          onClick={isVisible ? hideNotifications : showNotifications}
          className={`relative p-2 rounded-lg transition-all ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {isVisible && (
          <div className={`absolute top-full right-0 mt-2 w-80 max-h-96 rounded-lg border shadow-lg z-50 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <h3 className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Notificaciones
                </h3>
                {hasUnread && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                  }`}>
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    onClick={markAllAsRead}
                    className={`p-1 rounded transition-colors ${
                      darkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={hideNotifications}
                  className={`p-1 rounded transition-colors ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className={`p-6 text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Bell className={`w-8 h-8 mx-auto mb-2 ${
                    darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'
                    } ${
                      !notification.read 
                        ? darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50'
                        : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.read
                          ? 'bg-blue-500'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium truncate ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.leadName}
                          </p>
                          <span className={`text-xs flex-shrink-0 ml-2 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {truncateMessage(notification.messageText)}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            darkMode
                              ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                          }`}
                          title="Marcar como leída"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={`p-3 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={clearNotifications}
                  className={`w-full text-center text-sm py-2 rounded transition-colors ${
                    darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Limpiar todas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {activeToasts.map((toastId) => {
          const notification = notifications.find(n => n.id === toastId);
          if (!notification) return null;

          return (
            <div
              key={toastId}
              className={`max-w-sm p-4 rounded-lg shadow-lg border animate-slide-in-right ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">{notification.leadName}</p>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {truncateMessage(notification.messageText, 60)}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(toastId)}
                  className={`p-1 rounded transition-colors ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};