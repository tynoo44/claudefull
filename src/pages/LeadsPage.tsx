import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, MessageCircle, Tag, Calendar } from 'lucide-react';
import { SupabaseService, Lead } from '../lib/supabase';

interface LeadsPageProps {
  darkMode: boolean;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ darkMode }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => lead.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = [...new Set(leads.flatMap(lead => lead.tags))];

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-48 mb-4`}></div>
            <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-64 mb-8`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Users className="inline-block mr-3 h-8 w-8" />
                Gestión de Leads
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total de leads: {leads.length}
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Lead
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-3 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Buscar por nombre de usuario o nombre completo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Tags Filter */}
            <div className="lg:w-64">
              <select
                multiple
                value={selectedTags}
                onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                className={`w-full py-2 px-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer`}
            >
              {/* Header del Lead */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {lead.profile_pic ? (
                    <img
                      src={lead.profile_pic}
                      alt={lead.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    } flex items-center justify-center`}>
                      <Users className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      @{lead.username}
                    </h3>
                    {lead.full_name && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lead.full_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del Lead */}
              <div className="space-y-3">
                {lead.followers_count && (
                  <div className="flex items-center text-sm">
                    <Users className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {lead.followers_count.toLocaleString()} seguidores
                    </span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Calendar className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {new Date(lead.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>

                {lead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          darkMode 
                            ? 'bg-blue-900 text-blue-200' 
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {lead.notes && (
                  <div className="mt-3">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {lead.notes.length > 100 ? `${lead.notes.substring(0, 100)}...` : lead.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </button>
                  <button className={`flex-1 ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } text-sm py-2 px-3 rounded-lg`}>
                    Ver Perfil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No se encontraron leads</p>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};