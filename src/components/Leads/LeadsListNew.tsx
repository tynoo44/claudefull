import React, { useState } from 'react';
import { 
  Lead, 
  LeadStatus, 
  LeadProcedence,
  SupabaseService 
} from '../../lib/supabase';
import { 
  ChevronDown, 
  MessageCircle, 
  Calendar, 
  Trash2, 
  Clock, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Hash,
  User,
  Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatusClasses } from '../../utils/statusUtils';

interface LeadsListNewProps {
  darkMode: boolean;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLead?: (lead: Lead) => void;
}

type SortField = 'name' | 'status' | 'procedence' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

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

const PROCEDENCE_COLORS = {
  'Outbound': { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  'Inbound': { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  'CTA': { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  'Spam': { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' }
};

export const LeadsListNew: React.FC<LeadsListNewProps> = ({
  darkMode,
  leads,
  onEditLead,
  onDeleteLead,
  onUpdateLead
}) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: 'status' | 'procedence' | null }>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');

  // Sort leads
  const sortedLeads = [...leads].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'name':
        aValue = a.full_name || a.username;
        bValue = b.full_name || b.username;
        break;
      case 'status':
        aValue = a.status || 'Open';
        bValue = b.status || 'Open';
        break;
      case 'procedence':
        aValue = a.procedence || '';
        bValue = b.procedence || '';
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleChatClick = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    
    try {
      // Get conversation for this lead
      const { data: conversation, error } = await SupabaseService.supabase
        .from('conversations')
        .select('id')
        .eq('lead_id', lead.id)
        .single();

      if (error || !conversation) {
        console.error('No conversation found for lead:', lead.id);
        alert('No se encontró conversación para este lead');
        return;
      }

      // Navigate to chats with conversation selected
      navigate('/chats', { state: { selectedChatId: conversation.id } });
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    try {
      const updatedLead = await SupabaseService.updateLead(lead.id, { status: newStatus });
      onUpdateLead?.(updatedLead);
      setOpenDropdowns({});
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleProcedenceChange = async (lead: Lead, newProcedence: LeadProcedence | '') => {
    try {
      const updatedLead = await SupabaseService.updateLead(lead.id, { 
        procedence: newProcedence || null 
      });
      onUpdateLead?.(updatedLead);
      setOpenDropdowns({});
    } catch (error) {
      console.error('Error updating procedence:', error);
      alert('Error al actualizar la procedencia');
    }
  };

  const handleNameEdit = (lead: Lead) => {
    setEditingName(lead.id);
    setNameValue(lead.full_name || lead.username);
  };

  const handleNameSave = async (lead: Lead) => {
    try {
      const updatedLead = await SupabaseService.updateLead(lead.id, { 
        full_name: nameValue || lead.username
      });
      onUpdateLead?.(updatedLead);
      setEditingName(null);
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Error al actualizar el nombre');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm ${
      darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Lead Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Lead
                  <SortIcon field="name" />
                </button>
              </th>

              {/* Procedencia Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('procedence')}
                  className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Procedencia
                  <SortIcon field="procedence" />
                </button>
              </th>

              {/* Estado Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Estado
                  <SortIcon field="status" />
                </button>
              </th>

              {/* Tags Column */}
              <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Tags
              </th>

              {/* Fecha Creación Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('created_at')}
                  className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Creación
                  <SortIcon field="created_at" />
                </button>
              </th>

              {/* Última Actualización Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('updated_at')}
                  className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Actualización
                  <SortIcon field="updated_at" />
                </button>
              </th>

              {/* Acciones Column */}
              <th className={`px-6 py-4 text-center text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {sortedLeads.map((lead) => (
              <tr 
                key={lead.id}
                className={`group transition-all hover:bg-opacity-50 ${
                  darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                }`}
              >
                {/* Lead Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {lead.profile_pic ? (
                      <img 
                        src={lead.profile_pic} 
                        alt={lead.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${
                        darkMode ? 'bg-gray-700 ring-gray-800' : 'bg-gray-200 ring-white'
                      }`}>
                        <User className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                    )}
                    <div className="min-w-0">
                      {editingName === lead.id ? (
                        <input
                          type="text"
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onBlur={() => handleNameSave(lead)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleNameSave(lead);
                            }
                          }}
                          className={`px-2 py-1 rounded border text-sm font-medium ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="group/name flex items-center gap-2 cursor-pointer"
                          onClick={() => handleNameEdit(lead)}
                        >
                          <p className={`font-medium truncate ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {lead.full_name || lead.username}
                          </p>
                          <Edit3 className={`w-3 h-3 opacity-0 group-hover/name:opacity-100 transition-opacity ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                      )}
                      <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        @{lead.username}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Procedencia */}
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdowns({ 
                        ...openDropdowns, 
                        [lead.id]: openDropdowns[lead.id] === 'procedence' ? null : 'procedence' 
                      })}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        lead.procedence 
                          ? darkMode 
                            ? PROCEDENCE_COLORS[lead.procedence].dark 
                            : PROCEDENCE_COLORS[lead.procedence].light
                          : darkMode
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lead.procedence || 'Sin asignar'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${
                        openDropdowns[lead.id] === 'procedence' ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {openDropdowns[lead.id] === 'procedence' && (
                      <div className={`absolute top-full left-0 mt-1 min-w-[140px] rounded-lg border shadow-lg z-20 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          onClick={() => handleProcedenceChange(lead, '')}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg ${
                            !lead.procedence
                              ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                              : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          Sin asignar
                        </button>
                        {PROCEDENCE_OPTIONS.map(proc => (
                          <button
                            key={proc}
                            onClick={() => handleProcedenceChange(lead, proc)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg ${
                              lead.procedence === proc
                                ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {proc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Estado */}
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdowns({ 
                        ...openDropdowns, 
                        [lead.id]: openDropdowns[lead.id] === 'status' ? null : 'status' 
                      })}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        getStatusClasses(lead.status || 'Open', darkMode)
                      }`}
                    >
                      {lead.status || 'Open'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${
                        openDropdowns[lead.id] === 'status' ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {openDropdowns[lead.id] === 'status' && (
                      <div className={`absolute top-full left-0 mt-1 min-w-[200px] rounded-lg border shadow-lg z-20 max-h-64 overflow-y-auto ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        {STATUS_OPTIONS.map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(lead, status)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              lead.status === status
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
                </td>

                {/* Tags */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {lead.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Hash className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                    {lead.tags.length > 3 && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        +{lead.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>

                {/* Fecha Creación */}
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDateTime(lead.created_at)}
                </td>

                {/* Última Actualización */}
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDateTime(lead.updated_at)}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => handleChatClick(e, lead)}
                      className={`p-2 rounded-lg transition-all hover:scale-110 ${
                        darkMode 
                          ? 'hover:bg-blue-600/20 text-gray-400 hover:text-blue-400' 
                          : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                      }`}
                      title="Ir al chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditLead(lead)}
                      className={`p-2 rounded-lg transition-all hover:scale-110 ${
                        darkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Editar lead"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLead(lead.id);
                      }}
                      className={`p-2 rounded-lg transition-all hover:scale-110 ${
                        darkMode 
                          ? 'hover:bg-red-600/20 text-red-400 hover:text-red-300' 
                          : 'hover:bg-red-50 text-red-600 hover:text-red-500'
                      }`}
                      title="Eliminar lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {leads.length === 0 && (
        <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <User className={`w-12 h-12 mx-auto mb-4 opacity-20`} />
          <p className="text-lg font-medium">No se encontraron leads</p>
          <p className="text-sm mt-1">Ajusta tus filtros o añade nuevos leads</p>
        </div>
      )}
    </div>
  );
};