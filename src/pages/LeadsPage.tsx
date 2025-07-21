import React, { useState, useEffect } from 'react';
import { useLeadsVirtualization } from '../hooks/useLeadsVirtualization';
import { useTagFilter } from '../hooks/useTags';
import {
  Lead,
  LeadStatus,
  LeadProcedence,
  createLead,
  updateLead,
  deleteLead,
} from '../lib/supabase';
import { LeadsHeader } from '../components/Leads/LeadsHeader';
import { VirtualizedLeadsKanban } from '../components/Leads/VirtualizedLeadsKanban';
import { VirtualizedLeadsList } from '../components/Leads/VirtualizedLeadsList';
import { LeadModal } from '../components/Leads/LeadModal';
import { LeadInfoModal } from '../components/Chat/LeadInfoModal';
import { LeadCardSkeleton, LeadTableRowSkeleton } from '../components/common/SkeletonLoaders';

interface LeadsPageProps {
  darkMode: boolean;
}

interface AddLeadFormData {
  username: string;
  full_name?: string;
  notes?: string;
  tags: string[];
  status: LeadStatus;
  procedence?: LeadProcedence;
}

interface EditLeadFormData {
  full_name?: string;
  notes?: string;
  tags: string[];
  status: LeadStatus;
  procedence?: LeadProcedence;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ darkMode }) => {
  const {
    filteredLeads,
    leadsByStatus,
    loading,
    error,
    filteredCount,
    applyFilters,
    refresh,
    allTags,
  } = useLeadsVirtualization();

  const { selectedTags, toggleTag, clearTags } = useTagFilter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProcedence, setSelectedProcedence] = useState<string>('all');
  const [showFilters] = useState(true); // Always show filters
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters({
      searchTerm,
      selectedTags,
      statusFilter: selectedStatus,
      procedenceFilter: selectedProcedence,
      sortBy: 'updated',
      sortAscending: false,
    });
  }, [searchTerm, selectedTags, selectedStatus, selectedProcedence, applyFilters]);

  const handleAddLead = async (formData: AddLeadFormData) => {
    try {
      const leadData = {
        username: formData.username,
        full_name: formData.full_name || null,
        notes: formData.notes || null,
        tags: formData.tags,
        instagram_id: formData.username,
        profile_pic: null,
        followers_count: null,
        user_id: null,
        status: formData.status,
        procedence: formData.procedence || undefined,
      };

      await createLead(leadData);
      await refresh(); // Reload all leads
      setShowModal(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error al crear el lead');
    }
  };

  const handleEditLead = async (formData: EditLeadFormData) => {
    if (!editingLead) return;

    try {
      const leadData = {
        full_name: formData.full_name || null,
        notes: formData.notes || null,
        tags: formData.tags,
        status: formData.status,
        procedence: formData.procedence || undefined,
      };

      await updateLead(editingLead.id, leadData);
      await refresh(); // Reload all leads
      setShowModal(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error al actualizar el lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lead?')) return;

    try {
      await deleteLead(leadId);
      await refresh(); // Reload all leads
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error al eliminar el lead');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    clearTags();
    setSelectedStatus('all');
    setSelectedProcedence('all');
  };

  // allTags now comes from the hook

  if (loading && filteredLeads.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="h-screen flex flex-col">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <LeadsHeader
              darkMode={darkMode}
              totalLeads={0}
              viewMode={viewMode}
              showFilters={showFilters}
              onViewModeChange={setViewMode}
              onToggleFilters={() => {}}
              onAddLead={() => {
                setEditingLead(null);
                setShowModal(true);
              }}
              searchTerm={searchTerm}
              selectedTags={selectedTags}
              selectedStatus={selectedStatus}
              selectedProcedence={selectedProcedence}
              availableTags={allTags}
              onSearchChange={setSearchTerm}
              onTagToggle={toggleTag}
              onStatusChange={setSelectedStatus}
              onProcedenceChange={setSelectedProcedence}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="flex-1 overflow-hidden p-6">
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <LeadCardSkeleton key={i} darkMode={darkMode} />
                ))}
              </div>
            ) : (
              <div
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}
              >
                <table className="min-w-full">
                  <tbody
                    className={
                      darkMode
                        ? 'bg-gray-700 divide-y divide-gray-600'
                        : 'bg-white divide-y divide-gray-200'
                    }
                  >
                    {Array.from({ length: 10 }).map((_, i) => (
                      <LeadTableRowSkeleton key={i} darkMode={darkMode} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}
      >
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="text-lg mb-2">Error al cargar los leads</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="h-screen flex flex-col">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <LeadsHeader
            darkMode={darkMode}
            totalLeads={filteredCount}
            viewMode={viewMode}
            showFilters={showFilters}
            onViewModeChange={setViewMode}
            onToggleFilters={() => {}}
            onAddLead={() => {
              setEditingLead(null);
              setShowModal(true);
            }}
            // Filter props
            searchTerm={searchTerm}
            selectedTags={selectedTags}
            selectedStatus={selectedStatus}
            selectedProcedence={selectedProcedence}
            availableTags={allTags}
            onSearchChange={setSearchTerm}
            onTagToggle={toggleTag}
            onStatusChange={setSelectedStatus}
            onProcedenceChange={setSelectedProcedence}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === 'kanban' ? (
            <VirtualizedLeadsKanban
              darkMode={darkMode}
              leadsByStatus={leadsByStatus}
              onLeadUpdate={refresh}
            />
          ) : (
            <div className="p-6 h-full">
              <VirtualizedLeadsList
                darkMode={darkMode}
                leads={filteredLeads}
                onEditLead={lead => {
                  setSelectedLead(lead);
                  setShowInfoModal(true);
                }}
                onDeleteLead={handleDeleteLead}
                onUpdateLead={refresh}
              />
            </div>
          )}
        </div>

        <LeadModal
          darkMode={darkMode}
          isOpen={showModal}
          editingLead={editingLead}
          onClose={() => {
            setShowModal(false);
            setEditingLead(null);
          }}
          onSave={
            editingLead
              ? (handleEditLead as (leadData: Partial<Lead>) => void)
              : (handleAddLead as (leadData: Partial<Lead>) => void)
          }
        />

        {selectedLead && (
          <LeadInfoModal
            darkMode={darkMode}
            isOpen={showInfoModal}
            lead={selectedLead}
            onClose={() => {
              setShowInfoModal(false);
              setSelectedLead(null);
            }}
            onUpdate={updatedLead => {
              refresh();
              setSelectedLead(updatedLead);
            }}
          />
        )}
      </div>
    </div>
  );
};
