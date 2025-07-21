import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Chat, Template } from '@/types';
import { incrementTemplateUsage, updateMessageTemplate } from '../lib/supabase';
import { useConversationsQuery } from '../hooks/useConversationsQuery';
import { useMessagesPagination } from '../hooks/useMessagesPagination';
import { useTemplatesQuery } from '../hooks/useTemplatesQuery';
import { useLeadWithInsights } from '../hooks/useLeadWithInsights';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { ChatTemplatesView } from '../components/Chat/ChatTemplatesView';
import { EnhancedAIChatSidebar } from '../components/Chat/EnhancedAIChatSidebar';
import { ResizableLayout } from '../components/Chat/ResizableLayout';
import { ErrorState } from '../components/Chat/ErrorState';

interface ChatsPageProps {
  darkMode: boolean;
}

export const ChatsPage: React.FC<ChatsPageProps> = ({ darkMode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(522);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  const location = useLocation();
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { error: conversationsError } = useConversationsQuery();
  const { data: templatesData, error: templatesError } = useTemplatesQuery();
  const {
    messages,
    error: messagesError,
    isLoading: messagesLoading,
    hasMore: hasMoreMessages,
    isFetchingNextPage: isFetchingMoreMessages,
    loadMoreMessages,
    totalCount: totalMessages,
  } = useMessagesPagination(selectedChat?.id || null);
  
  // Obtener información del lead con insights
  const { data: leadData } = useLeadWithInsights(selectedChat?.leadId);

  const allTemplates = templatesData?.pages.flatMap(page => page.data) || [];

  useEffect(() => {
    const state = location.state as { selectedChatId?: string } | null;
    if (state?.selectedChatId) {
      setPendingChatId(state.selectedChatId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const insertTemplate = async (template: Template) => {
    setMessage(template.content);
    try {
      await incrementTemplateUsage(template.id);
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  };

  const handleTemplateDelete = (template: Template) => {
    console.log('Delete template:', template);
  };

  const handleToggleFavorite = async (template: Template) => {
    try {
      await updateMessageTemplate(template.id, { is_favorite: !template.isFavorite });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleChatUpdate = (updatedChat: Chat) => {
    setSelectedChat(updatedChat);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const error = conversationsError || templatesError || messagesError;
  if (error) {
    return (
      <div className={`h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ErrorState
          darkMode={darkMode}
          error={error.message}
          onRetry={() => queryClient.invalidateQueries()}
        />
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResizableLayout
          darkMode={darkMode}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarWidthChange={setSidebarWidth}
        >
          <ChatSidebar
            darkMode={darkMode}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            onCollapseChange={setSidebarCollapsed}
            width={sidebarWidth}
            pendingChatId={pendingChatId}
            onPendingChatLoaded={() => setPendingChatId(null)}
          />

          <ChatInterface
            darkMode={darkMode}
            selectedChat={selectedChat}
            message={message}
            messages={messages}
            messagesLoading={messagesLoading}
            hasMoreMessages={hasMoreMessages}
            isFetchingMoreMessages={isFetchingMoreMessages}
            onLoadMoreMessages={loadMoreMessages}
            totalMessages={totalMessages}
            showAISuggestion={showAISuggestion}
            onMessageChange={setMessage}
            onToggleAISuggestion={() => setShowAISuggestion(!showAISuggestion)}
            onTemplateInsert={() => {}}
            onChatUpdate={handleChatUpdate}
          />

          <ChatTemplatesView
            darkMode={darkMode}
            templates={allTemplates.map(t => ({
              ...t,
              uses: t.usage_count || 0,
              conversionRate: t.conversion_rate || 0,
              isFavorite: t.is_favorite || false,
            }))}
            onTemplateInsert={insertTemplate}
            onTemplateDelete={handleTemplateDelete}
            onToggleFavorite={handleToggleFavorite}
          />

          <EnhancedAIChatSidebar
            darkMode={darkMode}
            conversationContext={
              selectedChat ? `Chat con ${selectedChat.leadName || 'lead'}` : undefined
            }
            currentConversation={
              selectedChat
                ? {
                    ...selectedChat,
                    messages: messages || [],
                  }
                : undefined
            }
            conversationId={selectedChat?.id}
            leadId={selectedChat?.leadId}
            leadName={selectedChat?.leadName}
            leadData={leadData || undefined}
          />
        </ResizableLayout>
      </div>
    </div>
  );
};
