export const STATUS_COLORS = {
  Open: 'green',
  'Conectar y Cualificar': 'blue',
  'Situación Actual': 'purple',
  'Situación Deseada': 'orange',
  Obstáculo: 'red',
  Compromiso: 'yellow',
  Oferta: 'indigo',
  Agenda: 'teal',
  'Follow Up': 'yellow',
  Freeze: 'gray',
  Lose: 'red',
} as const;

export const getStatusClasses = (status: string, darkMode: boolean) => {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'gray';

  const colorClasses = {
    green: darkMode
      ? 'bg-green-600/20 text-green-400 border-green-500/30'
      : 'bg-green-100 text-green-700 border-green-200',
    yellow: darkMode
      ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200',
    blue: darkMode
      ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
      : 'bg-blue-100 text-blue-700 border-blue-200',
    purple: darkMode
      ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
      : 'bg-purple-100 text-purple-700 border-purple-200',
    orange: darkMode
      ? 'bg-orange-600/20 text-orange-400 border-orange-500/30'
      : 'bg-orange-100 text-orange-700 border-orange-200',
    red: darkMode
      ? 'bg-red-600/20 text-red-400 border-red-500/30'
      : 'bg-red-100 text-red-700 border-red-200',
    indigo: darkMode
      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
      : 'bg-indigo-100 text-indigo-700 border-indigo-200',
    teal: darkMode
      ? 'bg-teal-600/20 text-teal-400 border-teal-500/30'
      : 'bg-teal-100 text-teal-700 border-teal-200',
    gray: darkMode
      ? 'bg-gray-600/20 text-gray-400 border-gray-500/30'
      : 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return colorClasses[color as keyof typeof colorClasses];
};
