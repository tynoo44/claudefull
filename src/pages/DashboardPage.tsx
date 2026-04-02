import React, { useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Calendar,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStatsQuery } from '@/hooks/useDashboardStatsQuery';
import { useLeadsQuery } from '@/hooks/useLeadsQuery';
import { LeadStatus, LeadProcedence } from '@/types';
import { StatusChart } from '../components/Dashboard/StatusChart';
import { ProcedenceChart } from '../components/Dashboard/ProcedenceChart';
import { ActivityFeed } from '../components/Dashboard/ActivityFeed';
import { useAuth } from '../contexts/AuthContext';

interface DashboardPageProps {
  darkMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ darkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStatsQuery();
  const { data: leadsData, isLoading: leadsLoading } = useLeadsQuery();

  const allLeads = useMemo(() => leadsData?.pages.flatMap(page => page.data) || [], [leadsData]);

  const totalLeads = dashboardStats?.totalLeads || 0;
  const totalChats = dashboardStats?.activeConversations || 0;

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
    allLeads.forEach(lead => {
      if (lead && lead.status && lead.status in counts) {
        counts[lead.status as LeadStatus]++;
      }
    });
    return counts;
  }, [allLeads]);

  const procedenceCounts = useMemo(() => {
    const counts: Record<LeadProcedence, number> = { Outbound: 0, Inbound: 0, CTA: 0, Spam: 0 };
    allLeads.forEach(lead => {
      if (lead && lead.procedence && lead.procedence in counts) {
        counts[lead.procedence as LeadProcedence]++;
      }
    });
    return counts;
  }, [allLeads]);

  const conversionRate = totalLeads > 0 ? (statusCounts['Agenda'] / totalLeads) * 100 : 0;

  const activities = useMemo(() => {
    return [
      {
        id: '1',
        type: 'chat' as const,
        title: 'Nueva conversacion iniciada',
        description: 'Conversacion con lead de Instagram',
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
        description: 'Lead importado desde campana CTA',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'appointment' as const,
        title: 'Cita programada',
        description: 'Reunion para manana a las 10:00',
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

  const isLoading = statsLoading || leadsLoading;

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}
      >
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos dias' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const kpis = [
    {
      label: 'Total Leads',
      value: totalLeads,
      icon: Users,
      color: 'blue' as const,
      trend: '+12%',
      up: true,
    },
    {
      label: 'Conversaciones',
      value: totalChats,
      icon: MessageSquare,
      color: 'violet' as const,
      trend: '+8%',
      up: true,
    },
    {
      label: 'Conversion',
      value: `${conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'emerald' as const,
      trend: conversionRate > 5 ? '+2.3%' : '-1.2%',
      up: conversionRate > 5,
    },
    {
      label: 'Resp. media',
      value: '12m',
      icon: Clock,
      color: 'amber' as const,
      trend: '-18%',
      up: true,
    },
  ];

  const bgColorMap = {
    blue: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
    violet: darkMode ? 'bg-violet-500/10' : 'bg-violet-50',
    emerald: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
    amber: darkMode ? 'bg-amber-500/10' : 'bg-amber-50',
  };

  const iconColorMap = {
    blue: 'text-blue-500',
    violet: 'text-violet-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  };

  const quickActions = [
    { label: 'Nuevo lead', icon: Users, path: '/leads', color: 'blue' },
    { label: 'Ir a chats', icon: MessageSquare, path: '/chats', color: 'violet' },
    { label: 'Calendario', icon: Calendar, path: '/premium-calendar', color: 'emerald' },
    { label: 'Analytics', icon: TrendingUp, path: '/analytics', color: 'amber' },
  ];

  return (
    <div
      className={`min-h-screen overflow-y-auto transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {greeting}, {firstName}
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Aqui tienes el resumen de tu actividad
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-gray-800/40 border-gray-800 hover:bg-gray-800/60'
                    : 'bg-white border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${bgColorMap[kpi.color]}`}>
                    <Icon size={18} className={iconColorMap[kpi.color]} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      kpi.up ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {kpi.trend}
                  </span>
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {kpi.value}
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {kpi.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2
            className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Acciones rapidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className={`group flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    darkMode
                      ? 'bg-gray-800/30 border-gray-800 hover:bg-gray-800/60 hover:border-gray-700'
                      : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${bgColorMap[action.color as keyof typeof bgColorMap]}`}
                  >
                    <Icon
                      size={18}
                      className={iconColorMap[action.color as keyof typeof iconColorMap]}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    {action.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <StatusChart darkMode={darkMode} statusCounts={statusCounts} totalLeads={totalLeads} />
          <ProcedenceChart
            darkMode={darkMode}
            procedenceCounts={procedenceCounts}
            totalLeads={totalLeads}
          />
        </div>

        {/* Activity + AI Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed darkMode={darkMode} activities={activities} />
          </div>
          <div
            className={`p-5 rounded-xl border ${
              darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-500" />
              <h3
                className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Sugerencia IA
              </h3>
            </div>
            <div
              className={`p-4 rounded-lg mb-4 ${
                darkMode
                  ? 'bg-amber-500/5 border border-amber-500/10'
                  : 'bg-amber-50 border border-amber-100'
              }`}
            >
              <p
                className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {totalLeads > 0
                  ? `Tienes ${statusCounts['Open']} leads sin contactar. Te recomiendo priorizar los leads de ${
                      procedenceCounts.Inbound > procedenceCounts.Outbound ? 'Inbound' : 'Outbound'
                    } ya que tienen mayor tasa de conversion.`
                  : 'Empieza agregando tus primeros leads para que la IA te de recomendaciones personalizadas.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-blue-600/15 text-blue-400 hover:bg-blue-600/25'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Ver leads
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
