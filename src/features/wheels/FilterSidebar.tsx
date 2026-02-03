import React, { memo } from 'react';
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
  // Função para atualizar filtros e manter a consistência dos dados
  const updateFilter = (key: keyof FilterState, value: string) => {
    if (filters[key] === value) return; 
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const Section = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="mb-8 last:mb-0">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="bg-white lg:bg-transparent p-0">
      {/* Cabeçalho Mobile */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <h2 className="text-lg font-bold">Filtros</h2>
        <button onClick={onReset} className="text-sm text-gray-400 hover:text-black flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Limpar
        </button>
      </div>

      {/* Seção Modelo */}
      <Section title="Modelo">
        <select
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-black transition-all"
          value={filters.model}
          onChange={(e) => updateFilter('model', e.target.value)}
        >
          <option value="">Todos os modelos</option>
          {models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </Section>

      {/* Seção Aro (Corrigida para enviar apenas o número) */}
      <Section title="Aro">
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => {
            // Extraímos apenas os dígitos (ex: "Aro 15" -> "15")
            const sizeValue = size.replace(/[^\d]/g, '');
            const isActive = filters.size === sizeValue;

            return (
              <button
                key={size}
                type="button"
                onClick={() => updateFilter('size', isActive ? '' : sizeValue)}
                className={`px-3 py-1.5 text-xs rounded-md border font-black transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                }`}
              >
                {sizeValue}"
              </button>
            );
          })}
        </div>
      </Section>

      {/* Seção Furação */}
      <Section title="Furação">
        <select
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-black transition-all"
          value={filters.boltPattern}
          onChange={(e) => updateFilter('boltPattern', e.target.value)}
        >
          <option value="">Todas as furações</option>
          {boltPatterns.map(bp => (
            <option key={bp} value={bp}>{bp}</option>
          ))}
        </select>
      </Section>

      {/* Seção Acabamento */}
      <Section title="Acabamento">
        <select
          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-black transition-all"
          value={filters.finish}
          onChange={(e) => updateFilter('finish', e.target.value)}
        >
          <option value="">Todos os acabamentos</option>
          {finishes.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Section>

      {/* Seção Defeitos */}
      <Section title="Defeitos">
        <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scroll">
          {DEFECT_TYPES.map(type => {
            const isChecked = filters.defectType === type;
            return (
              <label key={type} className="flex items-center gap-3 py-1.5 px-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-black rounded border-gray-300"
                  checked={isChecked}
                  onChange={() => updateFilter('defectType', isChecked ? '' : type)}
                />
                <span className={`text-sm ${isChecked ? 'text-black font-bold' : 'text-gray-600'}`}>
                  {type}
                </span>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Botão de Reset Desktop */}
      <button
        onClick={onReset}
        className="hidden lg:flex w-full items-center justify-center gap-2 mt-8 py-3 text-sm font-black uppercase tracking-widest border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 active:scale-95 transition-all text-gray-400 hover:text-black"
      >
        <RotateCcw className="w-4 h-4" /> Limpar Filtros
      </button>
    </div>
  );
};

export default memo(FilterSidebar);
