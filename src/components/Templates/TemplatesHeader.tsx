import React from 'react';
import { FileText, Search, Plus, Star, ArrowUpDown } from 'lucide-react';

export type SortOption = 'mostUsed' | 'leastUsed' | 'successRate' | 'alphabetical' | 'recent';

interface TemplatesHeaderProps {
  darkMode: boolean;
  searchTerm: string;
  selectedCategory: string;
  categories: string[];
  templatesCount: number;
  sortBy?: SortOption;
  showFavoritesOnly?: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange?: (sort: SortOption) => void;
  onToggleFavorites?: () => void;
  onCreateNew: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  mostUsed: 'Mas usado',
  leastUsed: 'Menos usado',
  successRate: 'Tasa de exito',
  alphabetical: 'A-Z',
  recent: 'Reciente',
};

export const TemplatesHeader: React.FC<TemplatesHeaderProps> = ({
  darkMode,
  searchTerm,
  selectedCategory,
  categories,
  templatesCount,
  sortBy = 'mostUsed',
  showFavoritesOnly = false,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onToggleFavorites,
  onCreateNew,
}) => {
  return (
    <div
      className={`px-4 sm:px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
    >
      {/* Top row: Title + Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <FileText className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1
              className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Plantillas
            </h1>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {templatesCount} disponibles
            </span>
          </div>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Crear Plantilla</span>
        </button>
      </div>

      {/* Search + Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          {onSortChange && (
            <div className="relative group">
              <button
                className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 text-sm ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
              </button>
              <div
                className={`absolute top-full right-0 mt-1 w-44 rounded-xl border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => onSortChange(option)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      sortBy === option
                        ? darkMode
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {SORT_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorites toggle */}
          {onToggleFavorites && (
            <button
              onClick={onToggleFavorites}
              className={`p-2 rounded-lg border transition-all ${
                showFavoritesOnly
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                  : darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-500/30'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300'
              }`}
              title={showFavoritesOnly ? 'Mostrar todas' : 'Solo favoritas'}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(category => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {category === 'all' ? 'Todas' : category}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
