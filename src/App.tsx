import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalNavbar } from '@/components/Layout/GlobalNavbar';
import { AuthPage } from '@/pages/AuthPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChatsPage } from '@/pages/ChatsPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { CalendarPage } from '@/pages/CalendarPage';

import { useAppState } from '@/hooks/useAppState';

const AppContent: React.FC = () => {
  const {
    // State
    darkMode,
    isAuthenticated,
    currentUser,
    showProfileMenu,
    selectedChat,
    selectedTemplate,
    message,
    showAISuggestion,
    chats,
    templates,
    
    // Actions
    setShowProfileMenu,
    setSelectedTemplate,
    setMessage,
    setShowAISuggestion,
    toggleDarkMode,
    login,
    logout,
    selectChat,
  } = useAppState();

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileMenu(false);
    };

    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileMenu, setShowProfileMenu]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {isAuthenticated && (
        <GlobalNavbar
          darkMode={darkMode}
          showProfileMenu={showProfileMenu}
          currentUser={currentUser}
          toggleDarkMode={toggleDarkMode}
          setShowProfileMenu={setShowProfileMenu}
          logout={logout}
        />
      )}
      
      <div className={isAuthenticated ? "pt-16" : ""}>
        <Routes>
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage darkMode={darkMode} />
          } />
          <Route path="/auth/callback" element={<AuthCallbackPage darkMode={darkMode} />} />
          <Route path="/dashboard" element={
            isAuthenticated ? (
              <DashboardPage
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/auth" />
            )
          } />
          <Route path="/chats" element={
            isAuthenticated ? (
              <ChatsPage
                darkMode={darkMode}
                chats={chats}
                templates={templates}
                selectedChat={selectedChat}
                selectedTemplate={selectedTemplate}
                message={message}
                showAISuggestion={showAISuggestion}
                selectChat={selectChat}
                setSelectedTemplate={setSelectedTemplate}
                setMessage={setMessage}
                setShowAISuggestion={setShowAISuggestion}
              />
            ) : (
              <Navigate to="/auth" />
            )
          } />
          <Route path="/leads" element={
            isAuthenticated ? (
              <LeadsPage darkMode={darkMode} />
            ) : (
              <Navigate to="/auth" />
            )
          } />
          <Route path="/templates" element={
            isAuthenticated ? (
              <TemplatesPage darkMode={darkMode} />
            ) : (
              <Navigate to="/auth" />
            )
          } />
          <Route path="/calendar" element={
            isAuthenticated ? (
              <CalendarPage darkMode={darkMode} />
            ) : (
              <Navigate to="/auth" />
            )
          } />
          <Route path="/" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />
          } />
        </Routes>
      </div>
    </div>
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