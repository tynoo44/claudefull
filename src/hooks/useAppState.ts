import { useState, useCallback, useEffect } from 'react';
import { ModalType, ViewMode, Page, Lead, Chat, Template } from '@/types';
import { AuthService, AuthUser } from '../lib/auth';

export const useAppState = () => {
  // Core app state
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // View preferences
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Selected items
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Form state
  const [message, setMessage] = useState('');
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  // Data state - Se eliminan los datos mock, ahora se usan los hooks de Supabase
  const [leads, setLeads] = useState<Lead[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [templates] = useState<Template[]>([]);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setCurrentPage('dashboard');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(user => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        setCurrentPage('dashboard');
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentPage('auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Actions
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const login = useCallback(() => {
    // This is now handled by AuthService
    console.log('Login handled by AuthService');
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthService.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSelectedChat(null);
      setSelectedLead(null);
      setSelectedTemplate(null);
      setCurrentPage('auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const openModal = useCallback((modal: ModalType) => {
    setShowModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(null);
  }, []);

  const selectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    // Mark chat as read
    setChats(prev => prev.map(c => (c.id === chat.id ? { ...c, unread: false } : c)));
  }, []);

  const selectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
  }, []);

  const updateLead = useCallback((updatedLead: Lead) => {
    setLeads(prev => prev.map(lead => (lead.id === updatedLead.id ? updatedLead : lead)));
  }, []);

  const addLead = useCallback(
    (newLead: Omit<Lead, 'id'>) => {
      const id = Math.max(...leads.map(l => parseInt(l.id))) + 1;
      setLeads(prev => [...prev, { ...newLead, id: id.toString() }]);
    },
    [leads],
  );

  const deleteLead = useCallback(
    (leadId: string) => {
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    },
    [selectedLead],
  );

  return {
    // State
    currentPage,
    darkMode,
    isAuthenticated,
    currentUser,
    showModal,
    showProfileMenu,
    viewMode,
    selectedDate,
    selectedChat,
    selectedLead,
    selectedTemplate,
    message,
    showAISuggestion,
    leads,
    chats,
    templates,

    // Actions
    setCurrentPage,
    setShowProfileMenu,
    setViewMode,
    setSelectedDate,
    setSelectedTemplate,
    setMessage,
    setShowAISuggestion,
    toggleDarkMode,
    login,
    logout,
    openModal,
    closeModal,
    selectChat,
    selectLead,
    updateLead,
    addLead,
    deleteLead,
  };
};
