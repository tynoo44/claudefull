import React from 'react';
import { BarChart3 } from 'lucide-react';
import { LeadStatus } from '@/types';

interface StatusChartProps {
  darkMode: boolean;
  statusCounts: Record<LeadStatus, number>;
  totalLeads: number;
}

const STATUS_COLORS: Record<LeadStatus, { light: string; dark: string; bg: string }> = {
  Open: { light: 'text-gray-600', dark: 'text-gray-400', bg: 'bg-gray-500' },
  'Conectar y Cualificar': { light: 'text-blue-600', dark: 'text-blue-400', bg: 'bg-blue-500' },
  'Situación Actual': { light: 'text-cyan-600', dark: 'text-cyan-400', bg: 'bg-cyan-500' },
  'Situación Deseada': { light: 'text-indigo-600', dark: 'text-indigo-400', bg: 'bg-indigo-500' },
  Obstáculo: { light: 'text-orange-600', dark: 'text-orange-400', bg: 'bg-orange-500' },
  Compromiso: { light: 'text-purple-600', dark: 'text-purple-400', bg: 'bg-purple-500' },
  Oferta: { light: 'text-pink-600', dark: 'text-pink-400', bg: 'bg-pink-500' },
  Agenda: { light: 'text-green-600', dark: 'text-green-400', bg: 'bg-green-500' },
  'Follow Up': { light: 'text-yellow-600', dark: 'text-yellow-400', bg: 'bg-yellow-500' },
  Freeze: { light: 'text-slate-600', dark: 'text-slate-400', bg: 'bg-slate-500' },
  Lose: { light: 'text-red-600', dark: 'text-red-400', bg: 'bg-red-500' },
};

export const StatusChart: React.FC<StatusChartProps> = ({ darkMode, statusCounts, totalLeads }) => {
  const maxCount = Math.max(...Object.values(statusCounts));

  return (
    <div
      className={`p-6 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
          <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribución por Estado
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Leads organizados por etapa del proceso
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(statusCounts)
          .filter(([_, count]) => count > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([status, count]) => {
            const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const colors = STATUS_COLORS[status as LeadStatus];

            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                  <span
                    className={`text-sm font-medium min-w-0 flex-1 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bg} transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 min-w-[80px] justify-end">
                    <span
                      className={`text-sm font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {count}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {Object.values(statusCounts).every(count => count === 0) && (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay datos de estado disponibles</p>
        </div>
      )}
    </div>
  );
};
