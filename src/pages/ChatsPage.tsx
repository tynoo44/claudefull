import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Chat, Template } from '@/types';
import { SupabaseService } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { ChatTemplatesView } from '../components/Chat/ChatTemplatesView';
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
  message,
  showAISuggestion,
  selectChat,
  setSelectedTemplate,
  setMessage,
  setShowAISuggestion,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(522);
  const [localSelectedChat, setLocalSelectedChat] = useState(selectedChat);
  const location = useLocation();
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  
  // Load messages for current conversation
  const { messages } = useConversationMessages(localSelectedChat?.id || selectedChat?.id || null);

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

  const handleTemplateEdit = (template: Template) => {
    // TODO: Implement template editing in chat context
    console.log('Edit template:', template);
  };

  const handleTemplateDelete = (template: Template) => {
    // TODO: Implement template deletion in chat context
    console.log('Delete template:', template);
  };

  const handleToggleFavorite = (template: Template) => {
    // TODO: Implement toggle favorite in chat context
    console.log('Toggle favorite:', template);
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
        <ErrorState darkMode={darkMode} error={dataError} onRetry={fetchAllData} />
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
            onTemplateInsert={template => setSelectedTemplate(template)}
            onChatUpdate={handleChatUpdate}
          />

          {/* Templates */}
          <ChatTemplatesView
            darkMode={darkMode}
            templates={templatesFormatted}
            onTemplateInsert={insertTemplate}
            onTemplateEdit={handleTemplateEdit}
            onTemplateDelete={handleTemplateDelete}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* AI Chat */}
          <AIChatSidebar
            darkMode={darkMode}
            conversationContext={selectedChat ? `Chat con ${selectedChat.leadName || 'lead'}` : undefined}
            currentConversation={localSelectedChat || selectedChat ? {
              ...(localSelectedChat || selectedChat),
              messages: messages
            } : null}
          />
        </ResizableLayout>
      </div>
    </div>
  );
};
