import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { LeadStatus, LeadProcedence } from '@/types';
import { DashboardStats } from '../components/Dashboard/DashboardStats';
import { StatusChart } from '../components/Dashboard/StatusChart';
import { ProcedenceChart } from '../components/Dashboard/ProcedenceChart';
import { ActivityFeed } from '../components/Dashboard/ActivityFeed';

interface DashboardPageProps {
  darkMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ darkMode }) => {
  const { dashboardStats, leads } = useSupabaseData();

  const totalLeads = dashboardStats.totalLeads;
  const totalChats = dashboardStats.activeConversations;

  // Calculate status distribution
  const statusCounts = useMemo(() => {
    const counts: Record<LeadStatus, number> = {
      Open: 0,
      'Conectar y Cualificar': 0,
      'Situación Actual': 0,
      'Situación Deseada': 0,
      Obstáculo: 0,
      Compromiso: 0,
      Oferta: 0,
      Agenda: 0,
      'Follow Up': 0,
      Freeze: 0,
      Lose: 0,
    };

    leads.forEach(lead => {
      if (lead.status && lead.status in counts) {
        counts[lead.status]++;
      }
    });

    return counts;
  }, [leads]);

  // Calculate procedence distribution
  const procedenceCounts = useMemo(() => {
    const counts: Record<LeadProcedence, number> = {
      Outbound: 0,
      Inbound: 0,
      CTA: 0,
      Spam: 0,
    };

    leads.forEach(lead => {
      if (lead.procedence && lead.procedence in counts) {
        counts[lead.procedence]++;
      }
    });

    return counts;
  }, [leads]);

  // Generate mock activities
  const activities = useMemo(() => {
    return [
      {
        id: '1',
        type: 'chat' as const,
        title: 'Nueva conversación iniciada',
        description: 'Conversación con lead de Instagram',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        type: 'status_change' as const,
        title: 'Estado actualizado',
        description: 'Lead movido a "Agenda"',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'lead' as const,
        title: 'Nuevo lead creado',
        description: 'Lead importado desde campaña CTA',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'appointment' as const,
        title: 'Cita programada',
        description: 'Reunión para mañana a las 10:00',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        type: 'chat' as const,
        title: 'Mensaje enviado',
        description: 'Template de seguimiento enviado',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ];
  }, []);

  const stats = {
    totalLeads,
    totalChats,
    conversionRate: totalLeads > 0 ? (statusCounts['Agenda'] / totalLeads) * 100 : 0,
    avgResponseTime: 12,
    todayLeads: Math.floor(totalLeads * 0.1),
    todayChats: Math.floor(totalChats * 0.15),
    yesterdayLeads: Math.floor(totalLeads * 0.08),
    yesterdayChats: Math.floor(totalChats * 0.12),
  };

  return (
    <div
      className={`min-h-screen transition-colors p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${
              darkMode ? 'from-blue-500/20 to-purple-600/20' : 'from-blue-500/10 to-purple-600/10'
            }`}
          >
            <Activity className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Dashboard
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Resumen de tu actividad y rendimiento
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats darkMode={darkMode} stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StatusChart darkMode={darkMode} statusCounts={statusCounts} totalLeads={totalLeads} />
        <ProcedenceChart
          darkMode={darkMode}
          procedenceCounts={procedenceCounts}
          totalLeads={totalLeads}
        />
      </div>

      {/* Activity Feed */}
      <ActivityFeed darkMode={darkMode} activities={activities} />
    </div>
  );
};
