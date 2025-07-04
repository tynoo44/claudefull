import React, { useState, useEffect } from 'react';
import { SupabaseService, Lead } from '../lib/supabase';
import { LeadsHeaderNew } from '../components/Leads/LeadsHeaderNew';
import { LeadsFiltersNew } from '../components/Leads/LeadsFiltersNew';
import { LeadsKanban } from '../components/Leads/LeadsKanban';
import { LeadsListNew } from '../components/Leads/LeadsListNew';
import { LeadModal } from '../components/Leads/LeadModal';

interface LeadsPageProps {
  darkMode: boolean;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ darkMode }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProcedence, setSelectedProcedence] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const leadsData = await SupabaseService.getLeads();
        setLeads(leadsData);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

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
        procedence: formData.procedence || null
      };
      
      const createdLead = await SupabaseService.createLead(leadData);
      setLeads(prev => [createdLead, ...prev]);
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
        procedence: formData.procedence || null
      };
      
      const updatedLead = await SupabaseService.updateLead(editingLead.id, leadData);
      setLeads(prev => prev.map(lead => lead.id === editingLead.id ? updatedLead : lead));
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
      await SupabaseService.deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error al eliminar el lead');
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSelectedStatus('all');
    setSelectedProcedence('all');
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (lead.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => lead.tags.includes(tag));
    const matchesStatus = selectedStatus === 'all' || (lead.status || 'Open') === selectedStatus;
    const matchesProcedence = selectedProcedence === 'all' || lead.procedence === selectedProcedence;
    return matchesSearch && matchesTags && matchesStatus && matchesProcedence;
  });

  const allTags = [...new Set(leads.flatMap(lead => lead.tags))];

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="h-screen pt-16 flex flex-col">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <LeadsHeaderNew
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
          />
          
          {showFilters && (
            <LeadsFiltersNew
              darkMode={darkMode}
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
          )}
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {viewMode === 'kanban' ? (
            <LeadsKanban
              darkMode={darkMode}
              leads={filteredLeads}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setShowModal(true);
              }}
              onDeleteLead={handleDeleteLead}
            />
          ) : (
            <LeadsListNew
              darkMode={darkMode}
              leads={filteredLeads}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setShowModal(true);
              }}
              onDeleteLead={handleDeleteLead}
              onUpdateLead={(updatedLead) => {
                setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
              }}
            />
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