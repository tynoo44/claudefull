import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Usar datos reales de Supabase
  const { chats, templatesFormatted, error: dataError, fetchAllData } = useSupabaseData();

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
  };

  // Mostrar error si hay problemas con la carga de datos
  if (dataError && !chats.length) {
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
        <ResizableLayout darkMode={darkMode} sidebarCollapsed={sidebarCollapsed}>
          {/* Chat List */}
          <ChatSidebar
            darkMode={darkMode}
            chats={chats}
            selectedChat={selectedChat}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onChatSelect={handleChatSelect}
            onCollapseChange={setSidebarCollapsed}
          />

          {/* Chat Window */}
          <ChatInterface
            darkMode={darkMode}
            selectedChat={selectedChat}
            message={message}
            showAISuggestion={showAISuggestion}
            onMessageChange={setMessage}
            onToggleAISuggestion={() => setShowAISuggestion(!showAISuggestion)}
            onTemplateInsert={(template) => setSelectedTemplate(template)}
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
