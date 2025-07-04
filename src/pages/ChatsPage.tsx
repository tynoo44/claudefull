import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Chat, Template } from '@/types';
import { SupabaseService } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { TemplatesSidebar } from '../components/Chat/TemplatesSidebar';
import { AIChatSidebar } from '../components/Chat/AIChatSidebar';
import { ResizableLayout } from '../components/Chat/ResizableLayout';
import { ErrorState } from '../components/Chat/ErrorState';

interface ChatsPageProps {
  darkMode: boolean;
  chats: Chat[];
  templates: Template[];
  selectedChat: Chat | null;
  selectedTemplate: Template | null;
  message: string;
  showAISuggestion: boolean;
  selectChat: (chat: Chat) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setMessage: (message: string) => void;
  setShowAISuggestion: (show: boolean) => void;
}

export const ChatsPage: React.FC<ChatsPageProps> = ({
  darkMode,
  chats: _propsChats,
  templates: _propsTemplates,
  selectedChat,
  selectedTemplate,
  message,
  showAISuggestion,
  selectChat,
  setSelectedTemplate,
  setMessage,
  setShowAISuggestion
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [localSelectedChat, setLocalSelectedChat] = useState(selectedChat);
  const location = useLocation();
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);

  // Handle navigation state from leads page
  useEffect(() => {
    const state = location.state as { selectedChatId?: string } | null;
    if (state?.selectedChatId) {
      setPendingChatId(state.selectedChatId);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Usar datos reales de Supabase solo para templates (chats ahora se cargan progresivamente)
  const { templatesFormatted, error: dataError, fetchAllData } = useSupabaseData();

  const insertTemplate = async (template: Template) => {
    setMessage(template.content);
    setSelectedTemplate(template);
    
    try {
      await SupabaseService.incrementTemplateUsage(template.id);
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    selectChat(chat);
    setLocalSelectedChat(chat);
  };
  
  const handleChatUpdate = async (updatedChat: Chat) => {
    setLocalSelectedChat(updatedChat);
    // El ChatSidebar ahora maneja sus propias actualizaciones
  };

  // Mostrar error solo si hay problemas críticos con plantillas
  if (dataError && !templatesFormatted.length) {
    return (
      <div className={`h-screen pt-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ErrorState
          darkMode={darkMode}
          error={dataError}
          onRetry={fetchAllData}
        />
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex-1 pt-16 overflow-hidden">
        <ResizableLayout 
          darkMode={darkMode} 
          sidebarCollapsed={sidebarCollapsed}
          onSidebarWidthChange={setSidebarWidth}
        >
          {/* Chat List */}
          <ChatSidebar
            darkMode={darkMode}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            onCollapseChange={setSidebarCollapsed}
            width={sidebarWidth}
            pendingChatId={pendingChatId}
            onPendingChatLoaded={() => setPendingChatId(null)}
          />

          {/* Chat Window */}
          <ChatInterface
            darkMode={darkMode}
            selectedChat={localSelectedChat || selectedChat}
            message={message}
            showAISuggestion={showAISuggestion}
            onMessageChange={setMessage}
            onToggleAISuggestion={() => setShowAISuggestion(!showAISuggestion)}
            onTemplateInsert={(template) => setSelectedTemplate(template)}
            onChatUpdate={handleChatUpdate}
          />

          {/* Templates */}
          <TemplatesSidebar
            darkMode={darkMode}
            templates={templatesFormatted}
            selectedTemplate={selectedTemplate}
            onTemplateInsert={insertTemplate}
          />

          {/* AI Chat */}
          <AIChatSidebar
            darkMode={darkMode}
            conversationContext={selectedChat ? 'Contexto de la conversación' : undefined}
          />
        </ResizableLayout>
      </div>
    </div>
  );
};
