import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GlobalNavbar } from '@/components/Layout/GlobalNavbar';
import { AuthPage } from '@/pages/AuthPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { CalendarCacheProvider } from './contexts/CalendarCacheContext';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { conversationAnalysisService } from './services/conversationAnalysisService';

// Lazy-loaded pages for code splitting
const ChatsPage = React.lazy(() =>
  import('@/pages/ChatsPage').then(m => ({ default: m.ChatsPage })),
);
const LeadsPage = React.lazy(() =>
  import('@/pages/LeadsPage').then(m => ({ default: m.LeadsPage })),
);
const TemplatesPage = React.lazy(() =>
  import('@/pages/TemplatesPage').then(m => ({ default: m.TemplatesPage })),
);
const CalendarPage = React.lazy(() =>
  import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })),
);
const PremiumCalendarAdvanced = React.lazy(() =>
  import('@/pages/PremiumCalendarAdvanced').then(m => ({ default: m.PremiumCalendarAdvanced })),
);
const AnalyticsPage = React.lazy(() =>
  import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })),
);
const SettingsPage = React.lazy(() =>
  import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })),
);

const PageLoader: React.FC = () => {
  const { darkMode } = useTheme();
  return (
    <div
      className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  React.useEffect(() => {
    conversationAnalysisService.startBackgroundAnalysis();
    return () => {
      conversationAnalysisService.stopBackgroundAnalysis();
    };
  }, []);

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <GlobalNavbar
        darkMode={darkMode}
        showProfileMenu={showProfileMenu}
        currentUser={user ? { email: user.email || '', ...user.user_metadata } : null}
        toggleDarkMode={toggleDarkMode}
        setShowProfileMenu={setShowProfileMenu}
        logout={logout}
      />
      <main className="flex-1 overflow-hidden pt-14 sm:pt-16">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage darkMode={darkMode} />}
      />
      <Route path="/auth/callback" element={<AuthCallbackPage darkMode={darkMode} />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage darkMode={darkMode} />} />
          <Route path="/chats" element={<ChatsPage darkMode={darkMode} />} />
          <Route path="/leads" element={<LeadsPage darkMode={darkMode} />} />
          <Route path="/templates" element={<TemplatesPage darkMode={darkMode} />} />
          <Route path="/calendar" element={<CalendarPage darkMode={darkMode} />} />
          <Route
            path="/premium-calendar"
            element={
              <CalendarCacheProvider>
                <PremiumCalendarAdvanced darkMode={darkMode} />
              </CalendarCacheProvider>
            }
          />
          <Route path="/analytics" element={<AnalyticsPage darkMode={darkMode} />} />
          <Route path="/settings" element={<SettingsPage darkMode={darkMode} />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/auth'} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
