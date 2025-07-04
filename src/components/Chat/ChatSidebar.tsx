import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, MessageSquare, Filter, SortAsc, Hash, Loader } from 'lucide-react';
import { Chat, LeadStatus, LeadProcedence } from '@/types';
import { getStatusClasses } from '../../utils/statusUtils';
import { useConversationPagination } from '../../hooks/useConversationPagination';

interface ChatSidebarProps {
  darkMode: boolean;
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  width?: number;
}

const STATUS_OPTIONS: LeadStatus[] = [
  'Open',
  'Conectar y Cualificar',
  'Situación Actual',
  'Situación Deseada',
  'Obstáculo',
  'Compromiso',
  'Oferta',
  'Agenda',
  'Follow Up',
  'Freeze',
  'Lose'
];

const PROCEDENCE_OPTIONS: LeadProcedence[] = ['Outbound', 'Inbound', 'CTA', 'Spam'];

const SORT_OPTIONS = [
  { value: 'time', label: 'Último mensaje' },
  { value: 'name', label: 'Nombre' },
  { value: 'status', label: 'Estado' }
];

type SortType = 'time' | 'name' | 'status';

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  darkMode,
  selectedChat,
  onChatSelect,
  onCollapseChange,
  width = 384
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);
  const [procedenceFilter, setProcedenceFilter] = useState<LeadProcedence | null>(null);
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortType>('time');
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
    refresh
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
    
    const time = lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : new Date(conv.updated_at).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return {
      id: conv.id,
      leadId: conv.lead_id,
      leadName: leadData?.full_name || leadData?.username || 'Usuario desconocido',
      lastMessage: lastMessage?.text || 'Sin mensajes',
      timestamp: lastMessage ? lastMessage.created_at : conv.updated_at,
      time: time,
      unread: conv.unreadCount > 0,
      avatar: leadData?.profile_pic || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23${darkMode ? '374151' : 'E5E7EB'}" width="100" height="100"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${(leadData?.full_name || leadData?.username || 'U').charAt(0).toUpperCase()}</text></svg>`,
      status: (leadData?.status || 'Open') as LeadStatus,
      isOnline: true,
      platform: 'instagram' as const,
      tags: leadData?.tags || [],
      leadData: {
        ...leadData,
        id: leadData.id,
        procedence: leadData.procedence as LeadProcedence
      },
      unreadCount: conv.unreadCount || 0
    } as Chat;
  });
  
  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters(searchTerm, statusFilter, procedenceFilter, tagFilter, sortBy);
  }, [searchTerm, statusFilter, procedenceFilter, tagFilter, sortBy, applyFilters]);

  if (isCollapsed) {
    return (
      <div className={`relative h-full w-16 border-r transition-all duration-300 flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="p-4">
          <button
            onClick={() => handleCollapse(false)}
            className={`w-full p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {chats.map((chat, index) => {
            // Trigger load more check when approaching end
            if (index === chats.length - 5) {
              checkAndLoadMore(index);
            }
            
            return (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`relative w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                  selectedChat?.id === chat.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:scale-105'
                      : 'hover:bg-gray-100 text-gray-600 hover:scale-105'
                }`}
                title={chat.leadName}
              >
                {chat.avatar.startsWith('data:image/svg') ? (
                  <div dangerouslySetInnerHTML={{ __html: decodeURIComponent(chat.avatar.split(',')[1]) }} className="w-full h-full rounded-lg" />
                ) : (
                  <img 
                    src={chat.avatar} 
                    alt={chat.leadName} 
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23${darkMode ? '374151' : 'E5E7EB'}" width="100" height="100"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${chat.leadName.charAt(0).toUpperCase()}</text></svg>`;
                    }}
                  />
                )}
                {chat.unread && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800" />
                )}
              </button>
            );
          })}
          
          {/* Loading indicator for collapsed view */}
          {loading && (
            <div className="flex justify-center py-2">
              <Loader className={`w-4 h-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ width: `${width}px` }}
      className={`relative h-full border-r transition-all duration-300 flex flex-col ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
              darkMode 
                ? 'from-blue-500/20 to-blue-600/20' 
                : 'from-blue-500/10 to-blue-600/10'
            }`}>
              <MessageSquare className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Conversaciones
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {totalCount} chats • {chats.length} cargados
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCollapse(true)}
            className={`p-2 rounded-lg transition-all hover:scale-110 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-2">
          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                statusFilter
                  ? 'bg-blue-600 text-white border-blue-600'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {statusFilter || 'Estado'}
            </button>
            {showStatusDropdown && (
              <div className={`absolute top-full left-0 mt-1 min-w-[200px] rounded-lg border shadow-lg z-50 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setShowStatusDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                    !statusFilter
                      ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                      : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Todos los estados
                </button>
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                      statusFilter === status
                        ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Procedence Filter */}
          <div className="relative">
            <button
              onClick={() => setShowProcedenceDropdown(!showProcedenceDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                procedenceFilter
                  ? 'bg-blue-600 text-white border-blue-600'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Hash className="w-4 h-4" />
              {procedenceFilter || 'Procedencia'}
            </button>
            {showProcedenceDropdown && (
              <div className={`absolute top-full left-0 mt-1 min-w-[150px] rounded-lg border shadow-lg z-50 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setProcedenceFilter(null);
                    setShowProcedenceDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                    !procedenceFilter
                      ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                      : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Todas las procedencias
                </button>
                {PROCEDENCE_OPTIONS.map(procedence => (
                  <button
                    key={procedence}
                    onClick={() => {
                      setProcedenceFilter(procedence);
                      setShowProcedenceDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                      procedenceFilter === procedence
                        ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {procedence}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SortAsc className="w-4 h-4" />
              {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
            </button>
            {showSortDropdown && (
              <div className={`absolute top-full left-0 mt-1 min-w-[150px] rounded-lg border shadow-lg z-50 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as SortType);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value
                        ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={`mx-4 mb-4 p-3 rounded-lg border-l-4 ${
          darkMode 
            ? 'bg-red-900/20 border-red-500 text-red-300' 
            : 'bg-red-50 border-red-500 text-red-700'
        }`}>
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
        {chats.map((chat, index) => {
          // Trigger load more check when approaching end
          if (index === chats.length - 5) {
            checkAndLoadMore(index);
          }
          
          return (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`p-4 mx-2 mb-1 rounded-xl cursor-pointer transition-all ${
                selectedChat?.id === chat.id
                  ? (darkMode 
                      ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30' 
                      : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200')
                  : (darkMode 
                      ? 'hover:bg-gray-700/50 hover:scale-[1.02]' 
                      : 'hover:bg-gray-50 hover:scale-[1.02]')
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  {chat.avatar.startsWith('data:image/svg') ? (
                    <div 
                      className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium"
                      dangerouslySetInnerHTML={{ __html: decodeURIComponent(chat.avatar.split(',')[1]) }} 
                    />
                  ) : (
                    <img 
                      src={chat.avatar} 
                      alt={chat.leadName} 
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23${darkMode ? '374151' : 'E5E7EB'}" width="100" height="100"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${chat.leadName.charAt(0).toUpperCase()}</text></svg>`;
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className={`text-sm font-medium truncate ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {chat.leadName}
                      </h3>
                      {chat.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          getStatusClasses(chat.status, darkMode)
                        }`}>
                          {chat.status}
                        </span>
                      )}
                      {chat.leadData?.procedence && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                          chat.leadData.procedence === 'Outbound' 
                            ? darkMode ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-700'
                            : chat.leadData.procedence === 'Inbound'
                            ? darkMode ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-green-50 border-green-300 text-green-700'
                            : chat.leadData.procedence === 'CTA'
                            ? darkMode ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' : 'bg-purple-50 border-purple-300 text-purple-700'
                            : chat.leadData.procedence === 'Spam'
                            ? darkMode ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-300 text-red-700'
                            : darkMode ? 'bg-gray-900/20 border-gray-500/50 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}>
                          {chat.leadData.procedence}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs flex-shrink-0 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatDate(chat.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {chat.lastMessage}
                      </p>
                      {chat.tags && chat.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {chat.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              <Hash className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                          {chat.tags.length > 2 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              +{chat.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {chat.unread && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full ml-2 flex-shrink-0 shadow-lg">
                        {(chat as any).unreadCount || '•'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader className={`w-5 h-5 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
        )}
        
        {/* No more items indicator */}
        {!hasMore && chats.length > 0 && (
          <div className={`text-center py-4 text-sm ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            No hay más conversaciones
          </div>
        )}
        
        {/* Empty state */}
        {!loading && chats.length === 0 && (
          <div className={`text-center py-8 text-sm ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p>No hay conversaciones</p>
          </div>
        )}
      </div>
    </div>
  );
};