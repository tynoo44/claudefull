import React from 'react';
import { MessageSquare, Search, Plus } from 'lucide-react';

interface TemplatesHeaderProps {
  darkMode: boolean;
  searchTerm: string;
  selectedCategory: string;
  categories: string[];
  templatesCount: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  onCreateNew: () => void;
}

export const TemplatesHeader: React.FC<TemplatesHeaderProps> = ({
  darkMode,
  searchTerm,
  selectedCategory,
  categories,
  templatesCount,
  onSearchChange,
  onCategoryChange,
  onCreateNew,
}) => {
  return (
    <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${
              darkMode ? 'from-blue-500/20 to-purple-600/20' : 'from-blue-500/10 to-purple-600/10'
            }`}
          >
            <MessageSquare className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Templates de Mensajes
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {templatesCount} templates disponibles
            </p>
          </div>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Crear Template
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => onCategoryChange(e.target.value)}
          className={`px-4 py-3 rounded-xl border transition-all min-w-[180px] ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Todas las categorías' : category}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
