import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Loader } from 'lucide-react';
import { Chat, LeadStatus, LeadProcedence } from '@/types';
import { useConversationPagination } from '../../hooks/useConversationPagination';
import { ChatSidebarHeader } from './ChatSidebarHeader';
import { ChatSidebarSearch } from './ChatSidebarSearch';
import { ChatSidebarFilters } from './ChatSidebarFilters';
import { ChatListItem } from './ChatListItem';
import { ChatSidebarCollapsed } from './ChatSidebarCollapsed';
import { ChatSidebarSkeleton } from '../common/SkeletonLoaders';

interface ChatSidebarProps {
  darkMode: boolean;
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  width?: number;
  pendingChatId?: string | null;
  onPendingChatLoaded?: () => void;
}

type SortType = 'time' | 'name' | 'status' | 'unread' | 'start-date';

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  darkMode,
  selectedChat,
  onChatSelect,
  onCollapseChange,
  width = 418,
  pendingChatId,
  onPendingChatLoaded,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);
  const [procedenceFilter, setProcedenceFilter] = useState<LeadProcedence | null>(null);
  const [tagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortType>('time');
  const [sortAscending, setSortAscending] = useState(false); // Default descending for most sorts
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProcedenceDropdown, setShowProcedenceDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Pagination hook
  const {
    conversations,
    loading,
    hasMore,
    error,
    totalCount,
    checkAndLoadMore,
    applyFilters,
    refresh,
  } = useConversationPagination();

  // Refs for intersection observer
  const chatListRef = useRef<HTMLDivElement>(null);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapseChange?.(collapsed);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  // Convertir conversaciones a formato Chat compatible
  const chats = conversations.map(conv => {
    const leadData = conv.leads;
    const lastMessage = conv.lastMessage;

    const time = lastMessage
      ? new Date(lastMessage.created_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date(conv.updated_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });

    return {
      id: conv.id,
      leadId: conv.lead_id,
      leadName: leadData?.full_name || leadData?.username || 'Usuario desconocido',
      lastMessage: lastMessage?.text || 'Sin mensajes',
      timestamp: lastMessage ? lastMessage.created_at : conv.updated_at,
      time: time,
      unread: conv.hasUnansweredMessages,
      avatar:
        leadData?.profile_pic ||
        `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23${darkMode ? '374151' : 'E5E7EB'}" width="100" height="100"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${(leadData?.full_name || leadData?.username || 'U').charAt(0).toUpperCase()}</text></svg>`,
      status: (leadData?.status || 'Open') as LeadStatus,
      isOnline: true,
      platform: 'instagram' as const,
      tags: leadData?.tags || [],
      leadData: {
        ...leadData,
        id: leadData.id,
        procedence: leadData.procedence as LeadProcedence,
        tags: leadData?.tags || [],
      } as Chat['leadData'],
      unreadCount: conv.unreadCount || 0,
      hasUnansweredMessages: conv.hasUnansweredMessages,
      openedAt: conv.opened_at,
    } as Chat & { hasUnansweredMessages: boolean; openedAt: string };
  });

  // Aplicar filtros cuando cambien
  useEffect(() => {
    // Eliminar 'applyFilters' de las dependencias y llamarlo directamente
    // para evitar re-renders innecesarios cuando la función se recrea.
    applyFilters(searchTerm, statusFilter, procedenceFilter, tagFilter, sortBy, sortAscending);
  }, [searchTerm, statusFilter, procedenceFilter, tagFilter, sortBy, sortAscending, applyFilters]);

  // Handle pending chat selection
  useEffect(() => {
    if (pendingChatId && chats.length > 0) {
      const chatToSelect = chats.find(chat => chat.id === pendingChatId);
      if (chatToSelect) {
        onChatSelect(chatToSelect);
        onPendingChatLoaded?.();
      }
    }
  }, [pendingChatId, chats, onChatSelect, onPendingChatLoaded]);

  if (isCollapsed) {
    return (
      <ChatSidebarCollapsed
        darkMode={darkMode}
        chats={chats}
        selectedChat={selectedChat}
        loading={loading}
        onExpand={() => handleCollapse(false)}
        onChatSelect={onChatSelect}
        checkAndLoadMore={checkAndLoadMore}
      />
    );
  }

  return (
    <div
      style={{ width: `${width}px` }}
      className={`relative h-full border-r transition-all duration-300 flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <ChatSidebarHeader
        darkMode={darkMode}
        totalCount={totalCount}
        loadedCount={chats.length}
        onCollapse={() => handleCollapse(true)}
      />

      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <ChatSidebarSearch
          darkMode={darkMode}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ChatSidebarFilters
          darkMode={darkMode}
          statusFilter={statusFilter}
          procedenceFilter={procedenceFilter}
          sortBy={sortBy}
          sortAscending={sortAscending}
          showStatusDropdown={showStatusDropdown}
          showProcedenceDropdown={showProcedenceDropdown}
          showSortDropdown={showSortDropdown}
          onStatusFilterChange={status => {
            setStatusFilter(status);
            setShowStatusDropdown(false);
          }}
          onProcedenceFilterChange={procedence => {
            setProcedenceFilter(procedence);
            setShowProcedenceDropdown(false);
          }}
          onSortChange={(newSortBy, ascending) => {
            setSortBy(newSortBy as SortType);
            setSortAscending(ascending);
            setShowSortDropdown(false);
          }}
          onDropdownToggle={dropdown => {
            if (dropdown === 'status') setShowStatusDropdown(!showStatusDropdown);
            if (dropdown === 'procedence') setShowProcedenceDropdown(!showProcedenceDropdown);
            if (dropdown === 'sort') setShowSortDropdown(!showSortDropdown);
          }}
        />
      </div>

      {/* Error state */}
      {error && (
        <div
          className={`mx-4 mb-4 p-3 rounded-lg border-l-4 ${
            darkMode
              ? 'bg-red-900/20 border-red-500 text-red-300'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          <p className="text-sm">{error}</p>
          <button
            onClick={refresh}
            className={`text-xs mt-1 underline ${
              darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'
            }`}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Chat List */}
      <div ref={chatListRef} className="overflow-y-auto flex-1">
        {/* Initial loading state */}
        {loading && chats.length === 0 && <ChatSidebarSkeleton darkMode={darkMode} />}

        {chats.map((chat, index) => {
          if (index === chats.length - 5) {
            checkAndLoadMore(index);
          }

          return (
            <ChatListItem
              key={chat.id}
              chat={chat}
              darkMode={darkMode}
              isSelected={selectedChat?.id === chat.id}
              onSelect={onChatSelect}
              formatDate={formatDate}
            />
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader
              className={`w-5 h-5 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            />
          </div>
        )}

        {/* No more items indicator */}
        {!hasMore && chats.length > 0 && (
          <div
            className={`text-center py-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          >
            No hay más conversaciones
          </div>
        )}

        {/* Empty state */}
        {!loading && chats.length === 0 && (
          <div
            className={`text-center py-8 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          >
            <MessageSquare
              className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
            <p>No hay conversaciones</p>
          </div>
        )}
      </div>
    </div>
  );
};
