import React, { useState, useEffect } from 'react';
import { X, Save, Plus, User, Instagram, Hash, Calendar, FileText, ChevronDown } from 'lucide-react';
import { Lead, LeadStatus, LeadProcedence } from '../../lib/supabase';
import { SupabaseService } from '../../lib/supabase';
import { getStatusClasses } from '../../utils/statusUtils';

interface LeadInfoModalProps {
  darkMode: boolean;
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedLead: Lead) => void;
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

export const LeadInfoModal: React.FC<LeadInfoModalProps> = ({
  darkMode,
  lead,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [newTag, setNewTag] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setEditedLead({
        ...lead,
        status: lead.status || 'Open',
        tags: lead.tags || [],
        notes: lead.notes || ''
      });
    }
  }, [lead]);

  if (!isOpen || !lead || !editedLead) return null;

  const handleAddTag = () => {
    if (newTag.trim() && !editedLead.tags.includes(newTag.trim())) {
      setEditedLead({
        ...editedLead,
        tags: [...editedLead.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedLead({
      ...editedLead,
      tags: editedLead.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    setEditedLead({
      ...editedLead,
      status: newStatus
    });
    setShowStatusDropdown(false);
  };

  const handleSave = async () => {
    if (!editedLead) return;
    
    setSaving(true);
    try {
      const updatedLead = await SupabaseService.updateLead(editedLead.id, {
        status: editedLead.status,
        tags: editedLead.tags,
        notes: editedLead.notes,
        procedence: editedLead.procedence
      });
      
      if (onUpdate) {
        onUpdate(updatedLead);
      }
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error al actualizar el lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className={`lead-modal relative w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Información del Lead
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Profile Section */}
          <div className="flex items-start gap-4">
            <div className="relative">
              {editedLead.profile_pic ? (
                <img
                  src={editedLead.profile_pic}
                  alt={editedLead.full_name || editedLead.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <User className={`w-10 h-10 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {editedLead.full_name || editedLead.username}
              </h3>
              
              <div className={`flex items-center gap-2 mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Instagram className="w-4 h-4" />
                <span className="text-sm">@{editedLead.username}</span>
                {editedLead.followers_count && (
                  <>
                    <span className="text-sm">•</span>
                    <span className="text-sm">{editedLead.followers_count.toLocaleString()} seguidores</span>
                  </>
                )}
              </div>
              
              <div className={`flex items-center gap-2 mt-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Creado: {new Date(editedLead.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          {/* Status and Procedence Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Estado
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`w-full px-4 py-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    getStatusClasses(editedLead?.status || 'Open', darkMode)
                  }`}
                >
                  <span>{editedLead.status}</span>
                  <ChevronDown className={`w-4 h-4 ${
                    showStatusDropdown ? 'rotate-180' : ''
                  } transition-transform`} />
                </button>
                
                {showStatusDropdown && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-10 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}>
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full px-4 py-2 text-left transition-colors ${
                          editedLead.status === status
                            ? darkMode
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-blue-50 text-blue-600'
                            : darkMode
                              ? 'hover:bg-gray-600 text-gray-300'
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

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Procedencia
              </label>
              <select
                value={editedLead.procedence || ''}
                onChange={(e) => setEditedLead({ 
                  ...editedLead, 
                  procedence: e.target.value ? e.target.value as LeadProcedence : undefined 
                })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Sin asignar</option>
                <option value="Outbound">Outbound</option>
                <option value="Inbound">Inbound</option>
                <option value="CTA">CTA</option>
              </select>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {editedLead.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    darkMode
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir etiqueta..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </button>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <FileText className="w-4 h-4 inline mr-1" />
              Notas
            </label>
            <textarea
              value={editedLead.notes || ''}
              onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
              placeholder="Añade notas sobre este lead..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border resize-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};