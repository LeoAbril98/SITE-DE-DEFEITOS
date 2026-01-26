import React from 'react';
import { FilterState } from '../../types/wheel';
import { DEFECT_TYPES, SIZES } from '../../utils/constants';
import { RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;

  models: string[];
  boltPatterns: string[];
  finishes: string[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  onReset,
  models,
  boltPatterns,
  finishes,
}) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children?: React.ReactNode;
  }) => (
    <div className="mb-8 last:mb-0">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="bg-white lg:bg-transparent p-0">
      {/* MOBILE HEADER */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <h2 className="text-lg font-bold">Filtros</h2>
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-black flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Limpar
        </button>
      </div>

      {/* MODELO */}
      <Section title="Modelo">
        <select
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm"
          value={filters.model}
          onChange={(e) => updateFilter('model', e.target.value)}
        >
          <option value="">Todos</option>
          {models.map(model => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </Section>

      {/* ARO */}
      <Section title="Aro">
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button
              key={size}
              onClick={() =>
                // Aqui enviamos o 'size' completo (ex: "Aro 15") para o estado
                updateFilter('size', filters.size === size ? '' : size)
              }
              className={`px-3 py-1.5 text-xs rounded-md border ${filters.size === size
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-gray-600'
                }`}
            >
              {/* Aqui limpamos apenas o que o usuário vê: "Aro 15" vira "15" */}
              {size.replace(/[^\d]/g, '')}"
            </button>
          ))}
        </div>
      </Section>

      {/* FURAÇÃO */}
      <Section title="Furação">
        <select
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm"
          value={filters.boltPattern}
          onChange={(e) => updateFilter('boltPattern', e.target.value)}
        >
          <option value="">Todas</option>
          {boltPatterns.map(bp => (
            <option key={bp} value={bp}>
              {bp}
            </option>
          ))}
        </select>
      </Section>

      {/* ACABAMENTO */}
      <Section title="Acabamento">
        <select
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm"
          value={filters.finish}
          onChange={(e) => updateFilter('finish', e.target.value)}
        >
          <option value="">Todos</option>
          {finishes.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Section>

      {/* DEFEITOS */}
      <Section title="Defeitos">
        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
          {DEFECT_TYPES.map(type => (
            <label
              key={type}
              className="flex items-center gap-3 py-1 px-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.defectType === type}
                onChange={() =>
                  updateFilter(
                    'defectType',
                    filters.defectType === type ? '' : type
                  )
                }
              />
              <span className="text-sm text-gray-600">{type}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* LIMPAR DESKTOP */}
      <button
        onClick={onReset}
        className="hidden lg:flex w-full items-center justify-center gap-2 mt-8 py-3 text-sm font-semibold border border-gray-200 rounded-lg"
      >
        <RotateCcw className="w-4 h-4" /> Limpar Filtros
      </button>
    </div>
  );
};

export default FilterSidebar;
