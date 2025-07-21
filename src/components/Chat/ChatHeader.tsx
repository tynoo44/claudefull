import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Chat } from '@/types';
import { LeadInfoModal } from './LeadInfoModal';
import { updateLead } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';
import { LeadStatus, LeadProcedence } from '../../types';
import { Lead } from '../../lib/supabase';

interface ChatHeaderProps {
  darkMode: boolean;
  selectedChat: Chat;
  onChatUpdate?: (updatedChat: Chat) => void;
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
  'Lose',
];

const PROCEDENCE_OPTIONS: LeadProcedence[] = ['Outbound', 'Inbound', 'CTA', 'Spam'];

export const ChatHeader: React.FC<ChatHeaderProps> = ({ darkMode, selectedChat, onChatUpdate }) => {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProcedenceDropdown, setShowProcedenceDropdown] = useState(false);

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Only open modal if not clicking on dropdowns
    const target = e.target as HTMLElement;
    const isDropdownClick = target.closest('[data-dropdown]');

    if (!isDropdownClick) {
      setShowLeadModal(true);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      await updateLead(selectedChat.leadId, { status: newStatus });

      if (onChatUpdate) {
        onChatUpdate({
          ...selectedChat,
          status: newStatus,
        });
      }

      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleProcedenceChange = async (newProcedence: LeadProcedence) => {
    try {
      await updateLead(selectedChat.leadId, { procedence: newProcedence });

      if (onChatUpdate) {
        onChatUpdate({
          ...selectedChat,
          leadData: {
            ...selectedChat.leadData,
            procedence: newProcedence,
          },
        });
      }

      setShowProcedenceDropdown(false);
    } catch (error) {
      console.error('Error updating lead procedence:', error);
      alert('Error al actualizar la procedencia');
    }
  };

  return (
    <>
      <div
        className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleHeaderClick}
        >
          <div className="relative">
            <img
              src={selectedChat.avatar}
              alt={selectedChat.leadName}
              className="w-12 h-12 rounded-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23${darkMode ? '374151' : 'E5E7EB'}" width="100" height="100"/><text fill="%23${darkMode ? '9CA3AF' : '6B7280'}" font-size="40" x="50" y="50" text-anchor="middle" dy=".35em">${selectedChat.leadName.charAt(0).toUpperCase()}</text></svg>`;
              }}
            />
          </div>

          <div className="flex-1">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedChat.leadName}
            </h3>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Procedence Dropdown */}
          <div className="relative" data-dropdown>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowProcedenceDropdown(!showProcedenceDropdown);
              }}
              className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 transition-all hover:scale-105 ${
                selectedChat.leadData?.procedence === 'Outbound'
                  ? darkMode
                    ? 'bg-blue-900/20 border-blue-500/50 text-blue-400'
                    : 'bg-blue-50 border-blue-300 text-blue-700'
                  : selectedChat.leadData?.procedence === 'Inbound'
                    ? darkMode
                      ? 'bg-green-900/20 border-green-500/50 text-green-400'
                      : 'bg-green-50 border-green-300 text-green-700'
                    : selectedChat.leadData?.procedence === 'CTA'
                      ? darkMode
                        ? 'bg-purple-900/20 border-purple-500/50 text-purple-400'
                        : 'bg-purple-50 border-purple-300 text-purple-700'
                      : selectedChat.leadData?.procedence === 'Spam'
                        ? darkMode
                          ? 'bg-red-900/20 border-red-500/50 text-red-400'
                          : 'bg-red-50 border-red-300 text-red-700'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
              }`}
            >
              {selectedChat.leadData?.procedence || 'Sin procedencia'}
              <ChevronDown
                className={`w-3 h-3 ${showProcedenceDropdown ? 'rotate-180' : ''} transition-transform`}
              />
            </button>

            {showProcedenceDropdown && (
              <div
                className={`absolute top-full right-0 mt-1 min-w-[150px] rounded-lg border shadow-lg z-50 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                {PROCEDENCE_OPTIONS.map(procedence => (
                  <button
                    key={procedence}
                    onClick={e => {
                      e.stopPropagation();
                      handleProcedenceChange(procedence);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedChat.leadData?.procedence === procedence
                        ? darkMode
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {procedence}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" data-dropdown>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
              }}
              className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 transition-all hover:scale-105 ${getStatusClasses(
                selectedChat.status,
                darkMode,
              )}`}
            >
              {selectedChat.status}
              <ChevronDown
                className={`w-3 h-3 ${showStatusDropdown ? 'rotate-180' : ''} transition-transform`}
              />
            </button>

            {showStatusDropdown && (
              <div
                className={`absolute top-full right-0 mt-1 min-w-[200px] rounded-lg border shadow-lg z-50 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    onClick={e => {
                      e.stopPropagation();
                      handleStatusChange(status);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedChat.status === status
                        ? darkMode
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedChat.leadData && (
        <LeadInfoModal
          darkMode={darkMode}
          lead={selectedChat.leadData as unknown as Lead}
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          onUpdate={updatedLead => {
            if (onChatUpdate) {
              onChatUpdate({
                ...selectedChat,
                status: (updatedLead.status || selectedChat.status) as LeadStatus,
                tags: updatedLead.tags,
                leadData: {
                  ...selectedChat.leadData,
                  ...updatedLead,
                  procedence: updatedLead.procedence,
                  tags: updatedLead.tags,
                },
              });
            }
          }}
        />
      )}
    </>
  );
};
