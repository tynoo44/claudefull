import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  ArrowUp, 
  Target,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface DashboardPageProps {
  darkMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  darkMode
}) => {
  const navigate = useNavigate();
  const { dashboardStats, chats, leads } = useSupabaseData();

  const totalLeads = dashboardStats.totalLeads;
  const activeConversations = dashboardStats.activeConversations;
  const totalMessages = dashboardStats.totalMessages;
  const conversionRate = totalLeads > 0 ? Math.round((activeConversations / totalLeads) * 100) : 0;

  // Actividad reciente basada en datos reales
  const recentActivity = React.useMemo(() => {
    const activity: Array<{
      id: string;
      action: string;
      detail: string;
      time: string;
      type: string;
    }> = [];
    
    // Agregar actividad de leads recientes
    const recentLeads = leads.slice(0, 2);
    recentLeads.forEach(lead => {
      activity.push({
        id: `lead_${lead.id}`,
        action: 'Nuevo lead agregado',
        detail: lead.full_name || lead.username,
        time: new Date(lead.created_at).toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'lead'
      });
    });

    // Agregar actividad de chats recientes
    const recentChats = chats.slice(0, 2);
    recentChats.forEach(chat => {
      activity.push({
        id: `chat_${chat.id}`,
        action: 'Conversación actualizada',
        detail: `${chat.leadName} - ${chat.status}`,
        time: chat.time,
        type: 'message'
      });
    });

    return activity.slice(0, 4);
  }, [leads, chats]);

  const funnelData = React.useMemo(() => {
    const statusCounts = dashboardStats.conversationsByStatus || {};
    // const openConversations = statusCounts['open'] || statusCounts['Open'] || 0;
    const qualifiedConversations = Object.entries(statusCounts)
      .filter(([status]) => status !== 'open' && status !== 'Open')
      .reduce((sum, [, count]) => sum + count, 0);

    return [
      { stage: 'Leads Totales', count: totalLeads, percentage: 100, color: 'bg-blue-500' },
      { stage: 'Conversaciones Activas', count: activeConversations, percentage: totalLeads > 0 ? Math.round((activeConversations / totalLeads) * 100) : 0, color: 'bg-green-500' },
      { stage: 'En Proceso', count: qualifiedConversations, percentage: totalLeads > 0 ? Math.round((qualifiedConversations / totalLeads) * 100) : 0, color: 'bg-yellow-500' },
      { stage: 'Mensajes Enviados', count: totalMessages, percentage: totalLeads > 0 ? Math.round((totalMessages / totalLeads) * 10) : 0, color: 'bg-purple-500' }
    ];
  }, [totalLeads, activeConversations, totalMessages, dashboardStats.conversationsByStatus]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Resumen de tu actividad de appointment setting
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Leads
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalLeads}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500 ml-1">+12%</span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs. último mes
              </span>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Conversaciones Activas
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activeConversations}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500 ml-1">+8%</span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs. último mes
              </span>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Mensajes
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalMessages}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500 ml-1">+25%</span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs. último mes
              </span>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tasa de Conversión
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {conversionRate}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500 ml-1">+3%</span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs. último mes
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/chats')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 border-dashed transition-colors ${
                  darkMode 
                    ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Revisar Chats Pendientes
                  </span>
                </div>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeConversations}
                </span>
              </button>

              <button
                onClick={() => navigate('/leads')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 border-dashed transition-colors ${
                  darkMode 
                    ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Gestionar Leads
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/templates')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 border-dashed transition-colors ${
                  darkMode 
                    ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-700' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Target className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ver Plantillas
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/calendar')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 border-dashed transition-colors ${
                  darkMode 
                    ? 'border-gray-600 hover:border-yellow-500 hover:bg-gray-700' 
                    : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Calendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ver Calendario
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Sales Funnel */}
          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Embudo de Ventas
            </h3>
            <div className="space-y-4">
              {funnelData.map((stage) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {stage.stage}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stage.count} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className={`h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className={`h-3 rounded-full ${stage.color} transition-all duration-500`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`mt-8 p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'lead' ? 'bg-blue-100' :
                  activity.type === 'message' ? 'bg-green-100' :
                  activity.type === 'appointment' ? 'bg-purple-100' :
                  'bg-yellow-100'
                }`}>
                  {activity.type === 'lead' && <Users className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-green-600" />}
                  {activity.type === 'appointment' && <Calendar className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'qualified' && <CheckCircle className="w-4 h-4 text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {activity.action}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.detail}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};