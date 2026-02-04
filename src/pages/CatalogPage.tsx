import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState, WheelGroup } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";

const ITEMS_PER_PAGE = 12;

const CatalogPage: React.FC = () => {
  const [rawWheels, setRawWheels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [filterOptions, setFilterOptions] = useState<{
    models: string[];
    boltPatterns: string[];
    finishes: string[];
  }>({ models: [], boltPatterns: [], finishes: [] });

  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = sessionStorage.getItem("mkr_filters");
    return saved ? JSON.parse(saved) : {
      search: "",
      model: "",
      size: "",
      boltPattern: "",
      finish: "",
      defectType: "",
    };
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);

  // 1. MEMÓRIA DE SCROLL E FILTROS
  useEffect(() => {
    sessionStorage.setItem("mkr_filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("mkr_catalog_scroll");
    if (savedScroll && !loading) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem("mkr_catalog_scroll");
    }
  }, [loading]);

  const handleWheelClick = () => {
    sessionStorage.setItem("mkr_catalog_scroll", window.scrollY.toString());
  };

  const loadFilterOptions = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("individual_wheels")
        .select("model, bolt_pattern, finish");

      if (data) {
        setFilterOptions({
          models: [...new Set(data.map(r => r.model))].filter(Boolean).sort() as string[],
          boltPatterns: [...new Set(data.map(r => r.bolt_pattern))].filter(Boolean).sort() as string[],
          finishes: [...new Set(data.map(r => r.finish))].filter(Boolean).sort() as string[],
        });
      }
    } catch (e) {
      console.error("Erro nas opções de filtro:", e);
    }
  }, []);

  const loadWheels = useCallback(async (isInitial = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
        pageRef.current = 0;
      } else {
        setLoadingMore(true);
      }

      const from = pageRef.current * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase.from("individual_wheels").select("*");

      if (filters.model) query = query.eq('model', filters.model);
      if (filters.boltPattern) query = query.eq('bolt_pattern', filters.boltPattern);
      if (filters.finish) query = query.eq('finish', filters.finish);
      if (filters.size) query = query.ilike('size', `${filters.size}%`);

      if (filters.search) {
        query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.defectType) {
        query = query.contains('defects', [filters.defectType]);
      }

      const { data, error } = await query
        .order("model", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const rows = data ?? [];
      setRawWheels((prev) => (isInitial ? rows : [...prev, ...rows]));
      setHasMore(rows.length === ITEMS_PER_PAGE);
      if (rows.length > 0) pageRef.current += 1;

    } catch (err) {
      console.error("Erro ao carregar catálogo:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [filters]);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  // DEBOUNCE OTIMIZADO
  useEffect(() => {
    const timer = setTimeout(() => {
      loadWheels(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search, filters.model, filters.size, filters.boltPattern, filters.finish, filters.defectType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadWheels(false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadWheels]);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  const resetFilters = () => {
    setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" });
    setIsFilterModalOpen(false);
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />

      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">

          {/* SIDEBAR DESKTOP */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
                models={filterOptions.models}
                boltPatterns={filterOptions.boltPatterns}
                finishes={filterOptions.finishes}
              />
            </div>
          </aside>

          <div className="flex-grow">
            {/* BUSCA E FILTROS MOBILE */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por modelo (ex: R10)..."
                  className="w-full pl-12 pr-4 py-4 bg-white shadow-sm border border-transparent rounded-2xl focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-sm font-bold italic"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="lg:hidden flex items-center justify-center gap-3 px-8 py-4 bg-white shadow-sm rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </button>
            </div>

            {/* CHIPS DE FILTROS ATIVOS */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {Object.entries(filters).map(([key, value]) => {
                if (key === 'search' || !value) return null;
                return (
                  <button
                    key={key}
                    onClick={() => removeFilter(key as keyof FilterState)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-red-600 transition-colors animate-in zoom-in"
                  >
                    {key}: {value}
                    <X size={12} />
                  </button>
                );
              })}
              {Object.values(filters).some(v => v !== "") && (
                <button onClick={resetFilters} className="text-[10px] font-black uppercase text-gray-400 hover:text-black flex items-center gap-1 ml-2 transition-colors">
                  <RotateCcw size={12} /> Limpar
                </button>
              )}
            </div>

            {/* GRID DE RESULTADOS */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <WheelCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {wheelGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/roda/${group.wheels[0].id}`}
                    onClick={handleWheelClick}
                    className="group"
                  >
                    <WheelCard group={group} onClick={() => { }} />
                  </Link>
                ))}
              </div>
            )}

            {/* INFINITE SCROLL FEEDBACK */}
            <div ref={loadMoreRef} className="py-20 flex flex-col items-center justify-center min-h-[200px]">
              {loadingMore && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-black" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Carregando mais</p>
                </div>
              )}
              {!hasMore && !loading && wheelGroups.length > 0 && (
                <div className="h-[2px] w-24 bg-gray-200 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-gray-50 px-4 text-[10px] font-black uppercase text-gray-300">Fim</span>
                </div>
              )}
              {!loading && wheelGroups.length === 0 && (
                <div className="text-center py-20 animate-in fade-in">
                  <p className="text-2xl font-black italic text-gray-300 uppercase mb-2">Nenhum resultado</p>
                  <button onClick={resetFilters} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Resetar filtros</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL MOBILE */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[110] bg-white p-6 lg:hidden flex flex-col animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center mb-10">
            <h2 className="font-black uppercase italic text-3xl tracking-tighter">Filtros</h2>
            <button onClick={() => setIsFilterModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
          </div>
          <div className="flex-grow overflow-y-auto pr-2">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
              models={filterOptions.models}
              boltPatterns={filterOptions.boltPatterns}
              finishes={filterOptions.finishes}
            />
          </div>
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-sm tracking-widest mt-6 shadow-2xl active:scale-95 transition-transform"
          >
            Aplicar Filtros
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
};

// SKELETON COMPONENT
const WheelCardSkeleton = () => (
  <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
    <div className="aspect-square bg-gray-100 rounded-[2rem] animate-pulse" />
    <div className="space-y-2 px-2 pb-2">
      <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
      <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
    </div>
  </div>
);

export default CatalogPage;