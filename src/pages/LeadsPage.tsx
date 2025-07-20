import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeadsQuery } from '../hooks/useLeadsQuery';
import { Lead, createLead, updateLead, deleteLead } from '../lib/supabase';
import { LeadsHeader } from '../components/Leads/LeadsHeader';
import { LeadsKanban } from '../components/Leads/LeadsKanban';
import { LeadsList } from '../components/Leads/LeadsList';
import { LeadModal } from '../components/Leads/LeadModal';

interface LeadsPageProps {
  darkMode: boolean;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ darkMode }) => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useLeadsQuery();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProcedence, setSelectedProcedence] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleAddLead = async (formData: any) => {
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
        procedence: formData.procedence || null,
      };

      await createLead(leadData);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error al crear el lead');
    }
  };

  const handleEditLead = async (formData: any) => {
    if (!editingLead) return;

    try {
      const leadData = {
        full_name: formData.full_name || null,
        notes: formData.notes || null,
        tags: formData.tags,
        status: formData.status,
        procedence: formData.procedence || null,
      };

      await updateLead(editingLead.id, leadData);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
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
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error al eliminar el lead');
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSelectedStatus('all');
    setSelectedProcedence('all');
  };

  const allLeads = data?.pages.flatMap(page => page.data) || [];

  const filteredLeads = allLeads.filter(lead => {
    if (!lead) return false;
    const matchesSearch =
      lead.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (lead.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some(tag => lead.tags.includes(tag));
    const matchesStatus = selectedStatus === 'all' || (lead.status || 'Open') === selectedStatus;
    const matchesProcedence =
      selectedProcedence === 'all' || lead.procedence === selectedProcedence;
    return matchesSearch && matchesTags && matchesStatus && matchesProcedence;
  });

  const allTags = [...new Set(allLeads.flatMap(lead => lead?.tags || []))];

  if (status === 'pending') {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="h-screen pt-16 flex flex-col">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <LeadsHeader
            darkMode={darkMode}
            totalLeads={filteredLeads.length}
            viewMode={viewMode}
            showFilters={showFilters}
            onViewModeChange={setViewMode}
            onToggleFilters={() => setShowFilters(!showFilters)}
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
            onTagToggle={handleTagToggle}
            onStatusChange={setSelectedStatus}
            onProcedenceChange={setSelectedProcedence}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === 'kanban' ? (
            <LeadsKanban
              darkMode={darkMode}
              leads={filteredLeads}
              onLeadUpdate={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
            />
          ) : (
            <div className="p-6 h-full overflow-auto">
              <LeadsList
                darkMode={darkMode}
                leads={filteredLeads}
                onEditLead={lead => {
                  setEditingLead(lead);
                  setShowModal(true);
                }}
                onDeleteLead={handleDeleteLead}
                onUpdateLead={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
              />
                {hasNextPage && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                      {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
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
          onSave={editingLead ? handleEditLead : handleAddLead}
        />
      </div>
    </div>
  );
};
