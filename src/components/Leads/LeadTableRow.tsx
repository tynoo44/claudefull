import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MessageCircle, Trash2, Clock, Hash, User, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Lead, LeadStatus, LeadProcedence, updateLead } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';
import { createConversationForLead } from '../../lib/supabase-functions';

interface LeadTableRowProps {
  lead: Lead;
  darkMode: boolean;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLead?: (lead: Lead) => void;
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

export const LeadTableRow: React.FC<LeadTableRowProps> = ({
  lead,
  darkMode,
  onEditLead,
  onDeleteLead,
  onUpdateLead,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProcedenceDropdown, setShowProcedenceDropdown] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const procedenceRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (procedenceRef.current && !procedenceRef.current.contains(event.target as Node)) {
        setShowProcedenceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdating(true);
    try {
      const updatedLead = await updateLead(lead.id, { status: newStatus });
      onUpdateLead?.(updatedLead);
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Error updating lead status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProcedenceChange = async (newProcedence: LeadProcedence) => {
    setIsUpdating(true);
    try {
      const updatedLead = await updateLead(lead.id, { procedence: newProcedence });
      onUpdateLead?.(updatedLead);
      setShowProcedenceDropdown(false);
    } catch (error) {
      console.error('Error updating lead procedence:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChatClick = async () => {
    try {
      const conversation = await createConversationForLead(lead.id);
      navigate('/chats', {
        state: { selectedChatId: conversation.id },
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  const getProcedenceColor = (procedence: LeadProcedence) => {
    switch (procedence) {
      case 'Outbound':
        return darkMode
          ? 'bg-blue-900/20 text-blue-400 border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Inbound':
        return darkMode
          ? 'bg-green-900/20 text-green-400 border-green-500/30'
          : 'bg-green-50 text-green-700 border-green-200';
      case 'CTA':
        return darkMode
          ? 'bg-purple-900/20 text-purple-400 border-purple-500/30'
          : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Spam':
        return darkMode
          ? 'bg-red-900/20 text-red-400 border-red-500/30'
          : 'bg-red-50 text-red-700 border-red-200';
      default:
        return darkMode
          ? 'bg-gray-900/20 text-gray-400 border-gray-500/30'
          : 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <tr className={`transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            {lead.profile_pic ? (
              <img
                src={lead.profile_pic}
                alt={lead.full_name || lead.username || 'Lead'}
                className="w-10 h-10 rounded-full object-cover"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <User
              className={`w-5 h-5 ${lead.profile_pic ? 'hidden' : ''} ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
          </div>
          <div>
            <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {lead.full_name || lead.username || 'Sin nombre'}
            </div>
            {lead.username && lead.full_name && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                @{lead.username}
              </div>
            )}
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {lead.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Hash className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
                {lead.tags.length > 2 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    +{lead.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowProcedenceDropdown(false);
            }}
            disabled={isUpdating}
            className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-all ${getStatusClasses(
              lead.status || 'Open',
              darkMode,
            )} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {lead.status}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showStatusDropdown && (
            <div
              className={`absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg z-50 flex flex-col ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    lead.status === status
                      ? darkMode
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusClasses(status, darkMode).split(' ')[0]}`}
                    />
                    {status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative" ref={procedenceRef}>
          <button
            onClick={() => {
              setShowProcedenceDropdown(!showProcedenceDropdown);
              setShowStatusDropdown(false);
            }}
            disabled={isUpdating}
            className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-all ${getProcedenceColor(
              lead.procedence || 'Inbound',
            )} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {lead.procedence}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showProcedenceDropdown && (
            <div
              className={`absolute top-full left-0 mt-1 w-36 rounded-lg border shadow-lg z-50 flex flex-col ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {PROCEDENCE_OPTIONS.map(procedence => (
                <button
                  key={procedence}
                  onClick={() => handleProcedenceChange(procedence)}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    lead.procedence === procedence
                      ? darkMode
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        procedence === 'Outbound'
                          ? darkMode
                            ? 'bg-blue-400'
                            : 'bg-blue-600'
                          : procedence === 'Inbound'
                            ? darkMode
                              ? 'bg-green-400'
                              : 'bg-green-600'
                            : procedence === 'CTA'
                              ? darkMode
                                ? 'bg-purple-400'
                                : 'bg-purple-600'
                              : darkMode
                                ? 'bg-red-400'
                                : 'bg-red-600'
                      }`}
                    />
                    {procedence}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div
          className={`text-sm flex items-center gap-1 ${
            darkMode ? 'text-gray-300' : 'text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 opacity-50" />
          {new Date(lead.created_at).toLocaleDateString('es-ES')}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div
          className={`text-sm flex items-center gap-1 ${
            darkMode ? 'text-gray-300' : 'text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 opacity-50" />
          {new Date(lead.updated_at || lead.created_at).toLocaleDateString('es-ES')}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleChatClick}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400'
                : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'
            }`}
            title="Abrir chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEditLead(lead)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400'
                : 'hover:bg-gray-100 text-gray-600 hover:text-green-600'
            }`}
            title="Editar lead"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteLead(lead.id)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'
            }`}
            title="Eliminar lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
