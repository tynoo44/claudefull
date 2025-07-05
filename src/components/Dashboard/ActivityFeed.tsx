import React from 'react';
import { Activity, MessageSquare, Calendar, Target, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'chat' | 'lead' | 'appointment' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
}

interface ActivityFeedProps {
  darkMode: boolean;
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ darkMode, activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'lead':
        return <Target className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'status_change':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'chat':
        return darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600';
      case 'lead':
        return darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600';
      case 'appointment':
        return darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600';
      case 'status_change':
        return darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600';
      default:
        return darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
          <Activity className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Actividad Reciente
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Últimas acciones en el sistema
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, _index) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {activity.title}
                  </h4>
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>

                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activity.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay actividad reciente</p>
            <p className="text-xs mt-1">
              Las actividades aparecerán aquí cuando interactúes con leads
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
