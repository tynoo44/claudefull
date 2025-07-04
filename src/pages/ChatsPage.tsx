import React, { useState, useEffect } from 'react';
import { Chat, Template } from '@/types';
import { SupabaseService, Message } from '../lib/supabase';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatHeader } from '../components/Chat/ChatHeader';
import { MessageList } from '../components/Chat/MessageList';
import { MessageInput } from '../components/Chat/MessageInput';
import { TemplatesSidebar } from '../components/Chat/TemplatesSidebar';
import { AIChatSidebar } from '../components/Chat/AIChatSidebar';
import { ResizableLayout } from '../components/Chat/ResizableLayout';

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
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Usar datos reales de Supabase
  const { chats, templatesFormatted } = useSupabaseData();

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat) {
      const loadMessages = async () => {
        try {
          setLoading(true);
          const messages = await SupabaseService.getMessagesByConversation(selectedChat.id.toString());
          setChatMessages(messages);
        } catch (error) {
          console.error('Error loading messages:', error);
        } finally {
          setLoading(false);
        }
      };
      loadMessages();
    } else {
      setChatMessages([]);
    }
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    
    try {
      const messageData = {
        conversation_id: selectedChat.id.toString(),
        sender_type: 'Setter' as const,
        text: message,
        platform_message_id: null
      };
      
      const newMessage = await SupabaseService.sendMessage(messageData);
      setChatMessages(prev => [...prev, newMessage]);
      setMessage('');
      setShowAISuggestion(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    }
  };

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

  return (
    <div className={`h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="h-full pt-16">
        <ResizableLayout darkMode={darkMode}>
          {/* Chat List */}
          <ChatSidebar
            darkMode={darkMode}
            chats={chats}
            selectedChat={selectedChat}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onChatSelect={handleChatSelect}
          />

          {/* Chat Window */}
          <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {selectedChat ? (
              <>
                <ChatHeader darkMode={darkMode} selectedChat={selectedChat} />
                <MessageList 
                  darkMode={darkMode} 
                  messages={chatMessages} 
                  loading={loading} 
                />
                <MessageInput
                  darkMode={darkMode}
                  message={message}
                  showAISuggestion={showAISuggestion}
                  onMessageChange={setMessage}
                  onSendMessage={handleSendMessage}
                  onToggleAISuggestion={() => setShowAISuggestion(!showAISuggestion)}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                    💬
                  </div>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Selecciona una conversación
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Elige un chat de la lista para comenzar a conversar
                  </p>
                </div>
              </div>
            )}
          </div>

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
            conversationContext={selectedChat ? chatMessages.map(m => m.text).join('\n') : undefined}
          />
        </ResizableLayout>
      </div>
    </div>
  );
};