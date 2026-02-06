import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2, RotateCcw, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";

const ITEMS_PER_PAGE = 24;

const CatalogPage: React.FC = () => {
  const [rawWheels, setRawWheels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // Indica se o usuário mexeu no filtro

  const [filterOptions, setFilterOptions] = useState<{
    models: string[];
    boltPatterns: string[];
    finishes: string[];
  }>({ models: [], boltPatterns: [], finishes: [] });

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    model: "",
    size: "",
    boltPattern: "",
    finish: "",
    defectType: "",
  });

  const pageRef = useRef(0);
  const fetchingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const loadFilterOptions = useCallback(async () => {
    const { data } = await supabase
      .from("individual_wheels")
      .select("model, bolt_pattern, finish")
      .is("deleted_at", null);

    if (data) {
      setFilterOptions({
        models: [...new Set(data.map(r => r.model))].filter(Boolean).sort() as string[],
        boltPatterns: [...new Set(data.map(r => r.bolt_pattern))].filter(Boolean).sort() as string[],
        finishes: [...new Set(data.map(r => r.finish))].filter(Boolean).sort() as string[],
      });
    }
  }, []);

  const loadWheels = useCallback(async (isInitial = false) => {
    const myRequestId = ++requestIdRef.current;
    if (fetchingRef.current && !isInitial) return;
    fetchingRef.current = true;

    if (isInitial) {
      setLoading(true);
      pageRef.current = 0;
    } else {
      setLoadingMore(true);
    }

    const from = pageRef.current * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from("individual_wheels").select("*").is("deleted_at", null);

    if (filters.model) query = query.eq("model", filters.model);
    if (filters.boltPattern) query = query.eq("bolt_pattern", filters.boltPattern);
    if (filters.finish) query = query.eq("finish", filters.finish);
    if (filters.size) query = query.ilike("size", `%${filters.size}%`);
    if (filters.search) query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters.defectType) query = query.contains("defects", [filters.defectType]);

    const { data, error } = await query
      .order("model", { ascending: true })
      .order("size", { ascending: true })
      .order("bolt_pattern", { ascending: true })
      .range(from, to);

    if (myRequestId !== requestIdRef.current) return;

    const rows = data || [];
    setRawWheels(prev => (isInitial ? rows : [...prev, ...rows]));
    setHasMore(rows.length === ITEMS_PER_PAGE);
    if (rows.length > 0) pageRef.current += 1;

    setLoading(false);
    setLoadingMore(false);
    fetchingRef.current = false;
  }, [filters]);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);
  useEffect(() => { loadWheels(true); }, [filters, loadWheels]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) loadWheels(false);
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadWheels]);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  // Funções Auxiliares
  const handleReset = () => {
    setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" });
    setIsDirty(false);
    setIsFilterModalOpen(false);
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: "" }));
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => key !== 'search' && val !== "").length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />

      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR DESKTOP */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <FilterSidebar 
                filters={filters} 
                setFilters={(val) => { setFilters(val); setIsDirty(true); }} 
                onReset={handleReset}
                models={filterOptions.models} 
                boltPatterns={filterOptions.boltPatterns} 
                finishes={filterOptions.finishes}
              />
            </div>
          </aside>

          <div className="flex-grow min-w-0">
            {/* BUSCA E BOTÃO MOBILE */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-grow group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  className="w-full pl-12 pr-4 py-4 bg-white shadow-sm border border-transparent rounded-2xl focus:border-black outline-none transition-all text-sm font-bold italic"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="lg:hidden relative flex items-center justify-center px-6 bg-white shadow-sm rounded-2xl border border-gray-100"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* TAGS DE FILTROS ATIVOS */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6 animate-in fade-in slide-in-from-left-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (key === "search" || !value) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => removeFilter(key as keyof FilterState)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-tight hover:border-black transition-all"
                    >
                      <span className="text-gray-400">{key}:</span> {value}
                      <X size={12} className="text-red-500" />
                    </button>
                  );
                })}
                <button onClick={handleReset} className="text-[10px] font-black uppercase text-gray-400 hover:text-black flex items-center gap-1 ml-2">
                  <RotateCcw size={12} /> Limpar
                </button>
              </div>
            )}

            {/* RESULTADOS */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white rounded-[2.5rem] animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {wheelGroups.map(group => (
                  <Link key={group.id} to={`/roda/${group.wheels[0].id}`}>
                    <WheelCard group={group} onClick={() => {}} />
                  </Link>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="py-20 flex justify-center">
              {loadingMore && <Loader2 className="w-10 h-10 animate-spin text-black" />}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE FILTRO MOBILE AJUSTADO */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b border-gray-50">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Filtros</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ajuste sua busca</p>
              </div>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl">
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Filtro */}
            <div className="flex-grow overflow-y-auto p-6 custom-scroll">
              <FilterSidebar 
                filters={filters} 
                setFilters={(val) => { setFilters(val); setIsDirty(true); }}
                onReset={handleReset}
                models={filterOptions.models} 
                boltPatterns={filterOptions.boltPatterns} 
                finishes={filterOptions.finishes}
              />
            </div>

            {/* BOTÃO DE PESQUISAR DINÂMICO */}
            <div className={`p-6 border-t border-gray-50 transition-all duration-500 ${isDirty ? 'bg-black' : 'bg-white'}`}>
              <button 
                onClick={() => { setIsFilterModalOpen(false); setIsDirty(false); }}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                  isDirty 
                    ? 'text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDirty ? <Check size={18} /> : <Search size={18} />}
                {isDirty ? 'Aplicar Pesquisa' : 'Ver Resultados'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CatalogPage;
