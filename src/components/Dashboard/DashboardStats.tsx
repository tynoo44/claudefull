import React from 'react';
import {
  MessageSquare,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Target,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface DashboardStatsProps {
  darkMode: boolean;
  stats: {
    totalLeads: number;
    totalChats: number;
    conversionRate: number;
    avgResponseTime: number;
    todayLeads: number;
    todayChats: number;
    yesterdayLeads: number;
    yesterdayChats: number;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ darkMode, stats }) => {
  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const leadsChange = getChangeIndicator(stats.todayLeads, stats.yesterdayLeads);
  const chatsChange = getChangeIndicator(stats.todayChats, stats.yesterdayChats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Leads */}
      <div
        className={`p-6 rounded-xl border transition-all hover:scale-105 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Leads
            </p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalLeads.toLocaleString()}
            </p>
            <div className="flex items-center mt-2">
              {leadsChange.isPositive ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm ml-1 ${
                  leadsChange.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {leadsChange.value.toFixed(1)}%
              </span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs ayer
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Target className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
      </div>

      {/* Total Conversations */}
      <div
        className={`p-6 rounded-xl border transition-all hover:scale-105 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Conversaciones
            </p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalChats.toLocaleString()}
            </p>
            <div className="flex items-center mt-2">
              {chatsChange.isPositive ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm ml-1 ${
                  chatsChange.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {chatsChange.value.toFixed(1)}%
              </span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs ayer
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
            <MessageSquare
              className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
            />
          </div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div
        className={`p-6 rounded-xl border transition-all hover:scale-105 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Tasa Conversión
            </p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.conversionRate.toFixed(1)}%
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm ml-1 text-green-500">+2.3%</span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                vs mes anterior
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
            <CheckCircle className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
      </div>

      {/* Average Response Time */}
      <div
        className={`p-6 rounded-xl border transition-all hover:scale-105 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Tiempo Respuesta
            </p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.avgResponseTime}min
            </p>
            <div className="flex items-center mt-2">
              <ArrowDown className="w-4 h-4 text-green-500" />
              <span className="text-sm ml-1 text-green-500">-15%</span>
              <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                más rápido
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
            <Clock className={`w-8 h-8 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
