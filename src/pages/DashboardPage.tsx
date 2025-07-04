import React, { useMemo } from 'react';
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown,
  Target,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  BarChart3,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { LeadStatus, LeadProcedence } from '@/types';

interface DashboardPageProps {
  darkMode: boolean;
}

const STATUS_COLORS: Record<LeadStatus, { light: string; dark: string; bg: string }> = {
  'Open': { light: 'text-gray-600', dark: 'text-gray-400', bg: 'bg-gray-500' },
  'Conectar y Cualificar': { light: 'text-blue-600', dark: 'text-blue-400', bg: 'bg-blue-500' },
  'Situación Actual': { light: 'text-cyan-600', dark: 'text-cyan-400', bg: 'bg-cyan-500' },
  'Situación Deseada': { light: 'text-indigo-600', dark: 'text-indigo-400', bg: 'bg-indigo-500' },
  'Obstáculo': { light: 'text-orange-600', dark: 'text-orange-400', bg: 'bg-orange-500' },
  'Compromiso': { light: 'text-purple-600', dark: 'text-purple-400', bg: 'bg-purple-500' },
  'Oferta': { light: 'text-pink-600', dark: 'text-pink-400', bg: 'bg-pink-500' },
  'Agenda': { light: 'text-green-600', dark: 'text-green-400', bg: 'bg-green-500' },
  'Follow Up': { light: 'text-yellow-600', dark: 'text-yellow-400', bg: 'bg-yellow-500' },
  'Freeze': { light: 'text-slate-600', dark: 'text-slate-400', bg: 'bg-slate-500' },
  'Lose': { light: 'text-red-600', dark: 'text-red-400', bg: 'bg-red-500' }
};

const PROCEDENCE_COLORS = {
  'Outbound': { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400', icon: '📤' },
  'Inbound': { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400', icon: '📥' },
  'CTA': { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400', icon: '🎯' },
  'Spam': { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400', icon: '🚫' }
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  darkMode
}) => {
  const { dashboardStats, chats, leads } = useSupabaseData();

  const totalLeads = dashboardStats.totalLeads;
  const activeConversations = dashboardStats.activeConversations;
  const totalMessages = dashboardStats.totalMessages;
  const scheduledMeetings = leads.filter(lead => lead.status === 'Agenda').length;
  
  // Calculate daily stats (mock data for now - would come from real queries)
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= today;
    });
    
    const todayChats = chats.filter(chat => {
      const chatDate = new Date(chat.timestamp);
      return chatDate >= today;
    });
    
    return {
      newLeads: todayLeads.length,
      newChats: todayChats.length,
      responseRate: 87, // Mock
      avgResponseTime: 4.2 // Mock in minutes
    };
  }, [leads, chats]);
  
  // Calculate procedence distribution
  const procedenceStats = useMemo(() => {
    const distribution: Record<string, number> = {
      'Outbound': 0,
      'Inbound': 0,
      'CTA': 0,
      'Spam': 0
    };
    
    leads.forEach(lead => {
      if (lead.procedence && distribution[lead.procedence] !== undefined) {
        distribution[lead.procedence]++;
      }
    });
    
    return Object.entries(distribution).map(([key, value]) => ({
      name: key,
      value,
      percentage: totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0
    }));
  }, [leads, totalLeads]);
  
  // Calculate funnel data by status
  const funnelStats = useMemo(() => {
    const statusCounts = dashboardStats.conversationsByStatus || {};
    const statuses: LeadStatus[] = [
      'Open',
      'Conectar y Cualificar',
      'Situación Actual',
      'Situación Deseada',
      'Obstáculo',
      'Compromiso',
      'Oferta',
      'Agenda'
    ];
    
    return statuses.map(status => {
      const count = statusCounts[status] || 0;
      return {
        status,
        count,
        percentage: activeConversations > 0 ? Math.round((count / activeConversations) * 100) : 0
      };
    }).filter(item => item.count > 0);
  }, [dashboardStats.conversationsByStatus, activeConversations]);
  
  // Calculate response time distribution (mock data)
  const responseTimeData = [
    { range: '< 1 min', count: 45, percentage: 32 },
    { range: '1-5 min', count: 52, percentage: 37 },
    { range: '5-15 min', count: 28, percentage: 20 },
    { range: '15-30 min', count: 10, percentage: 7 },
    { range: '> 30 min', count: 5, percentage: 4 }
  ];

  // Performance metrics calculations
  const performanceMetrics = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Mock comparison data - in real app would query historical data
    return {
      leadsGrowth: 12,
      chatsGrowth: 8,
      meetingsGrowth: 25,
      responseTimeChange: -15 // negative is better
    };
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Estadísticas de hoy: {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Daily Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* New Chats Today */}
          <div className={`relative overflow-hidden rounded-2xl p-6 ${
            darkMode ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20' : 'bg-gradient-to-br from-blue-50 to-blue-100'
          }`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-600/30' : 'bg-blue-500/20'}`}>
                  <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/10 text-blue-600'
                }`}>
                  Hoy
                </span>
              </div>
              <h3 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {todayStats.newChats}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Nuevos chats abiertos
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <MessageSquare className="w-32 h-32" />
            </div>
          </div>

          {/* Scheduled Meetings */}
          <div className={`relative overflow-hidden rounded-2xl p-6 ${
            darkMode ? 'bg-gradient-to-br from-green-600/20 to-green-700/20' : 'bg-gradient-to-br from-green-50 to-green-100'
          }`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-green-600/30' : 'bg-green-500/20'}`}>
                  <Calendar className={`w-5 h-5 ${darkMode ? 'text-green-300' : 'text-green-600'}`} />
                </div>
                <div className="flex items-center gap-1">
                  {performanceMetrics.meetingsGrowth > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    performanceMetrics.meetingsGrowth > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(performanceMetrics.meetingsGrowth)}%
                  </span>
                </div>
              </div>
              <h3 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {scheduledMeetings}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Reuniones agendadas
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Calendar className="w-32 h-32" />
            </div>
          </div>

          {/* Response Rate */}
          <div className={`relative overflow-hidden rounded-2xl p-6 ${
            darkMode ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/20' : 'bg-gradient-to-br from-purple-50 to-purple-100'
          }`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-600/30' : 'bg-purple-500/20'}`}>
                  <Activity className={`w-5 h-5 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  todayStats.responseRate >= 80 
                    ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-600'
                    : darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {todayStats.responseRate >= 80 ? 'Excelente' : 'Mejorable'}
                </span>
              </div>
              <h3 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {todayStats.responseRate}%
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Tasa de respuesta
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
          </div>

          {/* Avg Response Time */}
          <div className={`relative overflow-hidden rounded-2xl p-6 ${
            darkMode ? 'bg-gradient-to-br from-orange-600/20 to-orange-700/20' : 'bg-gradient-to-br from-orange-50 to-orange-100'
          }`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-orange-600/30' : 'bg-orange-500/20'}`}>
                  <Clock className={`w-5 h-5 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`} />
                </div>
                <div className="flex items-center gap-1">
                  {performanceMetrics.responseTimeChange < 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    performanceMetrics.responseTimeChange < 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(performanceMetrics.responseTimeChange)}%
                  </span>
                </div>
              </div>
              <h3 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {todayStats.avgResponseTime}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Min. promedio respuesta
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Clock className="w-32 h-32" />
            </div>
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chat Sources Distribution */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Origen de Chats
              </h3>
              <PieChart className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            
            <div className="space-y-4">
              {procedenceStats.map((source) => (
                <div key={source.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{PROCEDENCE_COLORS[source.name as LeadProcedence]?.icon}</span>
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {source.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {source.value}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        darkMode 
                          ? PROCEDENCE_COLORS[source.name as LeadProcedence]?.dark 
                          : PROCEDENCE_COLORS[source.name as LeadProcedence]?.light
                      }`}>
                        {source.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full transition-all duration-500 ${
                        source.name === 'Outbound' ? 'bg-blue-500' :
                        source.name === 'Inbound' ? 'bg-green-500' :
                        source.name === 'CTA' ? 'bg-purple-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Counter */}
            <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total de leads
                </span>
                <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalLeads}
                </span>
              </div>
            </div>
          </div>

          {/* Lead Status Funnel */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Embudo de Conversión
              </h3>
              <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            
            <div className="space-y-3">
              {funnelStats.map((item, index) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      darkMode 
                        ? STATUS_COLORS[item.status].dark 
                        : STATUS_COLORS[item.status].light
                    }`}>
                      {item.status}
                    </span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.count}
                    </span>
                  </div>
                  <div className={`h-8 rounded-lg overflow-hidden relative ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                  }`}>
                    <div 
                      className={`h-full transition-all duration-700 ${STATUS_COLORS[item.status].bg}`}
                      style={{ 
                        width: `${item.percentage}%`,
                        transitionDelay: `${index * 100}ms`
                      }}
                    />
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                      item.percentage > 20 ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time Distribution */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Tiempos de Respuesta
              </h3>
              <Zap className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            
            <div className="space-y-3">
              {responseTimeData.map((item, index) => (
                <div key={item.range} className="flex items-center gap-3">
                  <div className={`w-20 text-xs font-medium text-right ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.range}
                  </div>
                  <div className="flex-1">
                    <div className={`h-6 rounded-full overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-full transition-all duration-700 ${
                          index === 0 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                          index === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                          index === 2 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          index === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ 
                          width: `${item.percentage}%`,
                          transitionDelay: `${index * 100}ms`
                        }}
                      />
                    </div>
                  </div>
                  <div className={`w-12 text-sm font-bold text-right ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Promedio general
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {todayStats.avgResponseTime} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Rendimiento del Setter
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full ${
                darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
              }`}>
                <Activity className="w-3 h-3 inline mr-1" />
                Activo ahora
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Messages per Lead */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="text-xs text-green-500 font-medium">+5%</span>
              </div>
              <p className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalMessages && totalLeads ? Math.round(totalMessages / totalLeads) : 0}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Mensajes por lead
              </p>
            </div>
            
            {/* Conversion Rate */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <Target className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="text-xs text-green-500 font-medium">+3%</span>
              </div>
              <p className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {Math.round((scheduledMeetings / activeConversations) * 100 || 0)}%
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tasa de agendamiento
              </p>
            </div>
            
            {/* Active Hours */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="text-xs text-yellow-500 font-medium">6.5h</span>
              </div>
              <p className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                89%
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tiempo activo
              </p>
            </div>
            
            {/* Quality Score */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="text-xs text-green-500 font-medium">Excelente</span>
              </div>
              <p className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                9.2
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Puntuación calidad
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};