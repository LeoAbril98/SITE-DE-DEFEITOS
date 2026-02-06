import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2, RotateCcw, Check, ShoppingBag, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";

const ITEMS_PER_PAGE = 24;

const CatalogPage: React.FC = () => {
  const [rawWheels, setRawWheels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, val]) => key !== 'search' && val !== "").length;
  }, [filters]);

  useEffect(() => {
    document.body.style.overflow = isFilterModalOpen ? 'hidden' : 'unset';
  }, [isFilterModalOpen]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from("individual_wheels")
        .select("model, bolt_pattern, finish")
        .is("deleted_at", null);

      if (err) throw err;
      if (data) {
        setFilterOptions({
          models: [...new Set(data.map(r => r.model))].filter(Boolean).sort() as string[],
          boltPatterns: [...new Set(data.map(r => r.bolt_pattern))].filter(Boolean).sort() as string[],
          finishes: [...new Set(data.map(r => r.finish))].filter(Boolean).sort() as string[],
        });
      }
    } catch (e) { console.error("Erro opções:", e); }
  }, []);

  const loadWheels = useCallback(async (isInitial = false) => {
    const myRequestId = ++requestIdRef.current;
    if (fetchingRef.current && !isInitial) return;
    fetchingRef.current = true;
    setError(null);

    try {
      if (isInitial) {
        setLoading(true);
        pageRef.current = 0;
        if (!isFilterModalOpen) window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (filters.defectType) query = query.contains("defects", [filters.defectType]);
      if (filters.search) query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

      const { data, error: dbError } = await query
        .order("model", { ascending: true })
        .order("size", { ascending: true })
        .order("bolt_pattern", { ascending: true })
        .range(from, to);

      if (dbError) throw dbError;
      if (myRequestId !== requestIdRef.current) return;

      const rows = data || [];
      setRawWheels(prev => (isInitial ? rows : [...prev, ...rows]));
      setHasMore(rows.length === ITEMS_PER_PAGE);
      if (rows.length > 0) pageRef.current += 1;

    } catch (err: any) {
      setError(err.message || "Falha ao carregar dados.");
    } finally {
      if (myRequestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
      fetchingRef.current = false;
    }
  }, [filters, isFilterModalOpen]);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWheels(true);
    }, filters.search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [filters, loadWheels]);

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
    if (isFilterModalOpen) setIsFilterModalOpen(false);
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />

      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">

          {/* SIDEBAR DESKTOP - LAYOUT MELHORADO */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col max-h-[calc(100vh-120px)]">

              {/* Header Fixo da Sidebar */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0">
                <h2 className="text-sm font-black uppercase italic tracking-tighter">Filtros</h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} /> Limpar
                  </button>
                )}
              </div>

              {/* Área de Scroll */}
              <div className="flex-grow overflow-y-auto p-6 custom-scroll">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  onReset={handleReset}
                  models={filterOptions.models}
                  boltPatterns={filterOptions.boltPatterns}
                  finishes={filterOptions.finishes}
                />
              </div>
            </div>
          </aside>

          <div className="flex-grow min-w-0">
            {/* Barra de Busca e Mobile Trigger */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  className="w-full pl-12 pr-4 py-4 bg-white shadow-sm border border-transparent rounded-2xl focus:border-black outline-none transition-all text-sm font-bold italic"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <button
                onClick={() => { setIsFilterModalOpen(true); setIsDirty(false); }}
                className="lg:hidden relative flex items-center justify-center px-6 bg-white shadow-sm rounded-2xl border border-gray-100 active:scale-95 transition-transform"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Grid de Resultados */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => <WheelCardSkeleton key={i} />)}
              </div>
            ) : wheelGroups.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 px-6">
                <ShoppingBag className="mx-auto w-12 h-12 text-gray-100 mb-4" />
                <p className="text-gray-400 font-bold italic mb-6">Nenhum resultado.</p>
                <button onClick={handleReset} className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase">Limpar Filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {wheelGroups.map(group => (
                  <Link key={group.id} to={`/roda/${group.wheels[0].id}`} className="block transition-transform duration-300 hover:-translate-y-2">
                    <WheelCard group={group} onClick={() => { }} />
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

      {/* MODAL MOBILE */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)} />
          <div className="relative ml-auto h-full w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Filtros</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 pb-32 overscroll-contain custom-scroll">
              <FilterSidebar
                filters={filters}
                setFilters={(val) => { setFilters(val); setIsDirty(true); }}
                onReset={handleReset}
                models={filterOptions.models}
                boltPatterns={filterOptions.boltPatterns}
                finishes={filterOptions.finishes}
              />
            </div>
            <div className="absolute bottom-8 left-0 right-0 px-6 pointer-events-none">
              <button
                onClick={() => { setIsFilterModalOpen(false); setIsDirty(false); }}
                className={`pointer-events-auto w-full py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 ${isDirty ? 'bg-black text-white' : 'bg-white text-black border border-gray-100'
                  }`}
              >
                {isDirty ? <Check size={16} /> : <Search size={16} />}
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
    <div className="h-4 bg-gray-50 rounded w-2/3 mx-auto animate-pulse" />
  </div>
);

export default CatalogPage;