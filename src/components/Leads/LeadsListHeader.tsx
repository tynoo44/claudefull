import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'name' | 'status' | 'procedence' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

interface LeadsListHeaderProps {
  darkMode: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const LeadsListHeader: React.FC<LeadsListHeaderProps> = ({
  darkMode,
  sortField,
  sortDirection,
  onSort,
}) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const headerClasses = `px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-50 transition-colors ${
    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
  }`;

  return (
    <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <tr>
        <th className={headerClasses} onClick={() => onSort('name')}>
          <div className="flex items-center gap-2">
            Lead
            {getSortIcon('name')}
          </div>
        </th>
        <th className={headerClasses} onClick={() => onSort('status')}>
          <div className="flex items-center gap-2">
            Estado
            {getSortIcon('status')}
          </div>
        </th>
        <th className={headerClasses} onClick={() => onSort('procedence')}>
          <div className="flex items-center gap-2">
            Procedencia
            {getSortIcon('procedence')}
          </div>
        </th>
        <th className={headerClasses} onClick={() => onSort('created_at')}>
          <div className="flex items-center gap-2">
            Creado
            {getSortIcon('created_at')}
          </div>
        </th>
        <th className={headerClasses} onClick={() => onSort('updated_at')}>
          <div className="flex items-center gap-2">
            Actualizado
            {getSortIcon('updated_at')}
          </div>
        </th>
        <th
          className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
            darkMode ? 'text-gray-300' : 'text-gray-500'
          }`}
        >
          Acciones
        </th>
      </tr>
    </thead>
  );
};
