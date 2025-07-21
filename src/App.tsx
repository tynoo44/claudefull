import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GlobalNavbar } from '@/components/Layout/GlobalNavbar';
import { AuthPage } from '@/pages/AuthPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChatsPage } from '@/pages/ChatsPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { PremiumCalendarAdvanced } from '@/pages/PremiumCalendarAdvanced';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { conversationAnalysisService } from './services/conversationAnalysisService';

const AppLayout: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  // Start background analysis service when app loads
  React.useEffect(() => {
    conversationAnalysisService.startBackgroundAnalysis();

    // Cleanup on unmount
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
      <main className="flex-1 overflow-hidden pt-16">
        <Outlet />
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

      {/* Test route for premium calendar - remove in production */}
      <Route path="/test-premium" element={<PremiumCalendarAdvanced darkMode={darkMode} />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage darkMode={darkMode} />} />
          <Route path="/chats" element={<ChatsPage darkMode={darkMode} />} />
          <Route path="/leads" element={<LeadsPage darkMode={darkMode} />} />
          <Route path="/templates" element={<TemplatesPage darkMode={darkMode} />} />
          <Route path="/calendar" element={<CalendarPage darkMode={darkMode} />} />
          <Route
            path="/premium-calendar"
            element={<PremiumCalendarAdvanced darkMode={darkMode} />}
          />
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
