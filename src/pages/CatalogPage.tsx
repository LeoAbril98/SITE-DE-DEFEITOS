import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2, RotateCcw, Check, ShoppingBag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";

const ITEMS_PER_PAGE = 24;

const CatalogPage: React.FC = () => {
  const [rawWheels, setRawWheels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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

  // Bloquear scroll quando o modal estiver aberto
  useEffect(() => {
    if (isFilterModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isFilterModalOpen]);

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

    const { data } = await query
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

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) loadWheels(false);
    }, { threshold: 0.1, rootMargin: '200px' });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadWheels]);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  const handleReset = () => {
    setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" });
    setIsDirty(false);
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
            {/* Barra de Busca Superior */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-grow group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Qual roda você procura?"
                  className="w-full pl-12 pr-4 py-4 bg-white shadow-sm border border-transparent rounded-2xl focus:border-black outline-none transition-all text-sm font-bold italic"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="lg:hidden relative flex items-center justify-center px-6 bg-white shadow-sm rounded-2xl border border-gray-100 transition-transform active:scale-95"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-bounce">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Badges de Filtro */}
            <div className="flex flex-wrap items-center gap-2 mb-8 min-h-[32px]">
              {Object.entries(filters).map(([key, value]) => {
                if (key === "search" || !value) return null;
                return (
                  <button
                    key={key}
                    onClick={() => removeFilter(key as keyof FilterState)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-red-600 transition-colors"
                  >
                    {key}: {value} <X size={12} />
                  </button>
                );
              })}
            </div>

            {/* Grid e Skeletons */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => <WheelCardSkeleton key={i} />)}
              </div>
            ) : wheelGroups.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <ShoppingBag className="mx-auto w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold italic">Nenhuma roda encontrada para essa combinação.</p>
                <button onClick={handleReset} className="mt-4 text-black underline font-black uppercase text-xs">Resetar Filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {wheelGroups.map(group => (
                  <Link key={group.id} to={`/roda/${group.wheels[0].id}`} className="transition-transform hover:-translate-y-1">
                    <WheelCard group={group} onClick={() => {}} />
                  </Link>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="py-20 flex justify-center">
              {loadingMore && <Loader2 className="w-8 h-8 animate-spin text-black" />}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Mobile Premium */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsFilterModalOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Filtros</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              <FilterSidebar 
                filters={filters} 
                setFilters={(val) => { setFilters(val); setIsDirty(true); }}
                onReset={handleReset}
                models={filterOptions.models} 
                boltPatterns={filterOptions.boltPatterns} 
                finishes={filterOptions.finishes}
              />
            </div>

            <div className="p-6 bg-white border-t">
              <button 
                onClick={() => { setIsFilterModalOpen(false); setIsDirty(false); }}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${
                  isDirty ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDirty ? <Check size={18} /> : <Search size={18} />}
                Ver {rawWheels.length} Resultados
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const WheelCardSkeleton = () => (
  <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
    <div className="aspect-square bg-gray-50 rounded-[2rem] animate-pulse" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-50 rounded w-2/3 mx-auto animate-pulse" />
      <div className="h-3 bg-gray-50 rounded w-1/3 mx-auto animate-pulse" />
    </div>
  </div>
);

export default CatalogPage;
