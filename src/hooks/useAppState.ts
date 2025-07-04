import { useState, useCallback } from 'react';
import { ModalType, ViewMode, Page, Lead, Chat, Template } from '@/types';

export const useAppState = () => {
  // Core app state
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  // Actions
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setSelectedChat(null);
    setSelectedLead(null);
    setSelectedTemplate(null);
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
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unread: false } : c
    ));
  }, []);

  const selectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
  }, []);

  const updateLead = useCallback((updatedLead: Lead) => {
    setLeads(prev => prev.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    ));
  }, []);

  const addLead = useCallback((newLead: Omit<Lead, 'id'>) => {
    const id = Math.max(...leads.map(l => l.id)) + 1;
    setLeads(prev => [...prev, { ...newLead, id }]);
  }, [leads]);

  const deleteLead = useCallback((leadId: number) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    if (selectedLead?.id === leadId) {
      setSelectedLead(null);
    }
  }, [selectedLead]);

  return {
    // State
    currentPage,
    darkMode,
    isAuthenticated,
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