import React from 'react';
import { PieChart } from 'lucide-react';
import { LeadProcedence } from '@/types';

interface ProcedenceChartProps {
  darkMode: boolean;
  procedenceCounts: Record<LeadProcedence, number>;
  totalLeads: number;
}

const PROCEDENCE_COLORS = {
  Outbound: {
    light: 'bg-blue-100 text-blue-700',
    dark: 'bg-blue-900/30 text-blue-400',
    icon: '📤',
    bg: 'bg-blue-500',
  },
  Inbound: {
    light: 'bg-green-100 text-green-700',
    dark: 'bg-green-900/30 text-green-400',
    icon: '📥',
    bg: 'bg-green-500',
  },
  CTA: {
    light: 'bg-purple-100 text-purple-700',
    dark: 'bg-purple-900/30 text-purple-400',
    icon: '🎯',
    bg: 'bg-purple-500',
  },
  Spam: {
    light: 'bg-red-100 text-red-700',
    dark: 'bg-red-900/30 text-red-400',
    icon: '🚫',
    bg: 'bg-red-500',
  },
};

export const ProcedenceChart: React.FC<ProcedenceChartProps> = ({
  darkMode,
  procedenceCounts,
  totalLeads,
}) => {
  return (
    <div
      className={`p-6 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
          <PieChart className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Fuente de Leads
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Distribución por procedencia
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(procedenceCounts).map(([procedence, count]) => {
          const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
          const colors = PROCEDENCE_COLORS[procedence as LeadProcedence];

          return (
            <div
              key={procedence}
              className={`p-4 rounded-lg border transition-all hover:scale-105 ${
                darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{colors.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    {procedence}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {count}
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {percentage.toFixed(1)}% del total
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.values(procedenceCounts).every(count => count === 0) && (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay datos de procedencia disponibles</p>
        </div>
      )}
    </div>
  );
};
