import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useDashboardStatsQuery } from '@/hooks/useDashboardStatsQuery';
import { useLeadsQuery } from '@/hooks/useLeadsQuery';
// Types imported from hooks

interface AnalyticsPageProps {
  darkMode: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Open: '#3b82f6',
  'Conectar y Cualificar': '#8b5cf6',
  'Situación Actual': '#f59e0b',
  'Situación Deseada': '#10b981',
  Obstáculo: '#ef4444',
  Compromiso: '#06b6d4',
  Oferta: '#f97316',
  Agenda: '#22c55e',
  'Follow Up': '#6366f1',
  Freeze: '#94a3b8',
  Lose: '#dc2626',
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ darkMode }) => {
  const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery();
  const { data: leadsData, isLoading: leadsLoading } = useLeadsQuery();

  const allLeads = useMemo(() => leadsData?.pages.flatMap(page => page.data) || [], [leadsData]);

  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    allLeads.forEach(lead => {
      if (lead?.status) {
        counts[lead.status] = (counts[lead.status] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => ({
        status,
        count,
        percentage: allLeads.length > 0 ? (count / allLeads.length) * 100 : 0,
        color: STATUS_COLORS[status] || '#6b7280',
      }));
  }, [allLeads]);

  const conversionRate = useMemo(() => {
    if (allLeads.length === 0) return 0;
    const agendaCount = allLeads.filter(l => l?.status === 'Agenda').length;
    return (agendaCount / allLeads.length) * 100;
  }, [allLeads]);

  const procedenceData = useMemo(() => {
    const counts: Record<string, number> = {};
    allLeads.forEach(lead => {
      if (lead?.procedence) {
        counts[lead.procedence] = (counts[lead.procedence] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allLeads]);

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

  const totalLeads = stats?.totalLeads || 0;
  const totalChats = stats?.activeConversations || 0;

  const kpis = [
    {
      label: 'Total Leads',
      value: totalLeads,
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Conversaciones',
      value: totalChats,
      change: '+8%',
      trend: 'up' as const,
      icon: MessageSquare,
      color: 'purple',
    },
    {
      label: 'Tasa Conversion',
      value: `${conversionRate.toFixed(1)}%`,
      change: conversionRate > 5 ? '+2.3%' : '-1.2%',
      trend: conversionRate > 5 ? ('up' as const) : ('down' as const),
      icon: Target,
      color: 'green',
    },
    {
      label: 'Tiempo Medio',
      value: '12min',
      change: '-18%',
      trend: 'up' as const,
      icon: Clock,
      color: 'orange',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    green: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
  };

  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-emerald-500',
    orange: 'text-orange-500',
  };

  return (
    <div
      className={`min-h-screen overflow-y-auto transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1
              className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Analytics
            </h1>
          </div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
            Metricas de rendimiento y conversion de tu pipeline
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className={`p-4 sm:p-5 rounded-xl border bg-gradient-to-br transition-all ${
                  darkMode
                    ? `${colorMap[kpi.color]} border-gray-800`
                    : `${colorMap[kpi.color]} border-gray-200`
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} className={iconColorMap[kpi.color]} />
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      kpi.trend === 'up'
                        ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
                        : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    }`}
                  >
                    {kpi.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.change}
                  </span>
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {kpi.value}
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {kpi.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Funnel */}
          <div
            className={`lg:col-span-2 p-5 sm:p-6 rounded-xl border ${
              darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <h3
              className={`text-base font-semibold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Funnel de ventas
            </h3>
            {funnelData.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin datos de leads todavia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funnelData.map(item => {
                  const maxCount = funnelData[0]?.count || 1;
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <div
                        className={`w-28 sm:w-36 text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      >
                        {item.status}
                      </div>
                      <div className="flex-1 relative">
                        <div
                          className={`h-7 rounded-md ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
                        >
                          <div
                            className="h-full rounded-md transition-all duration-500"
                            style={{
                              width: `${Math.max((item.count / maxCount) * 100, 4)}%`,
                              backgroundColor: item.color,
                              opacity: 0.85,
                            }}
                          />
                        </div>
                      </div>
                      <div
                        className={`w-16 text-right text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {item.count}{' '}
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          ({item.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Source breakdown */}
          <div
            className={`p-5 sm:p-6 rounded-xl border ${
              darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <h3
              className={`text-base font-semibold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Origen de leads
            </h3>
            {procedenceData.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin datos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {procedenceData.map(item => {
                  const total = procedenceData.reduce((s, i) => s + i.value, 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between mb-1.5">
                        <span
                          className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {item.name}
                        </span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.value} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div
                        className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Conversion metrics */}
        <div
          className={`p-5 sm:p-6 rounded-xl border ${
            darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <h3
            className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Resumen de conversion
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Leads abiertos',
                value: allLeads.filter(l => l?.status === 'Open').length,
                icon: Users,
              },
              {
                label: 'En proceso',
                value: allLeads.filter(
                  l =>
                    l?.status && !['Open', 'Agenda', 'Freeze', 'Lose'].includes(l.status as string),
                ).length,
                icon: TrendingUp,
              },
              {
                label: 'Agendados',
                value: allLeads.filter(l => l?.status === 'Agenda').length,
                icon: Calendar,
              },
              {
                label: 'Perdidos',
                value: allLeads.filter(l => l?.status === 'Lose' || l?.status === 'Freeze').length,
                icon: TrendingDown,
              },
            ].map(metric => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className={`p-4 rounded-lg text-center ${
                    darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                  <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {metric.value}
                  </div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {metric.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
