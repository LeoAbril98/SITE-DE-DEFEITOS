import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";

const ITEMS_PER_PAGE = 24;

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

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    model: "",
    size: "",
    boltPattern: "",
    finish: "",
    defectType: "",
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  /* 1) CARREGAR OPÇÕES DISPONÍVEIS */
  const loadFilterOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("individual_wheels")
        .select("model, bolt_pattern, finish")
        .is("deleted_at", null);

      if (error) throw error;
      if (data) {
        setFilterOptions({
          models: [...new Set(data.map((r) => r.model))].filter(Boolean).sort() as string[],
          boltPatterns: [...new Set(data.map((r) => r.bolt_pattern))].filter(Boolean).sort() as string[],
          finishes: [...new Set(data.map((r) => r.finish))].filter(Boolean).sort() as string[],
        });
      }
    } catch (e) {
      console.error("Erro ao carregar opções:", e);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  /* 2) CARREGAR RODAS COM ORDENAÇÃO HIERÁRQUICA */
  const loadWheels = useCallback(
    async (isInitial = false) => {
      const myRequestId = ++requestIdRef.current;
      if (fetchingRef.current && !isInitial) return;
      fetchingRef.current = true;

      try {
        if (isInitial) {
          setLoading(true);
          pageRef.current = 0;
          setHasMore(true);
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
        if (filters.search) {
          query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.defectType) {
          query = query.contains("defects", [filters.defectType]);
        }

        const { data, error } = await query
          .order("model", { ascending: true })
          .order("size", { ascending: true })
          .order("bolt_pattern", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to);

        if (error) throw error;
        if (myRequestId !== requestIdRef.current) return;

        const rows = data ?? [];
        setRawWheels((prev) => {
          const next = isInitial ? rows : [...prev, ...rows];
          const map = new Map();
          next.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });

        setHasMore(rows.length === ITEMS_PER_PAGE);
        if (rows.length > 0) pageRef.current += 1;
      } catch (err) {
        console.error("Erro ao carregar rodas:", err);
      } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        fetchingRef.current = false;
      }
    },
    [filters]
  );

  // Recarregar ao mudar filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      loadWheels(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, loadWheels]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadWheels(false);
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadWheels]);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  const resetFilters = () => {
    setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" });
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
      <Header />

      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
          
          {/* DESKTOP SIDEBAR */}
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

          <div className="flex-grow min-w-0">
            {/* SEARCH E BOTÃO MOBILE */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  className="w-full pl-12 pr-4 py-4 bg-white shadow-sm border border-transparent rounded-2xl focus:border-black outline-none transition-all text-sm font-bold italic"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>

              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="lg:hidden flex items-center justify-center gap-3 px-8 py-4 bg-white shadow-sm rounded-2xl text-xs font-black uppercase border border-gray-100 transition-all active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </button>
            </div>

            {/* LISTAGEM DE CARDS */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white rounded-[2rem] animate-pulse" />)}
              </div>
            ) : wheelGroups.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 px-6">
                <p className="text-gray-400 font-bold italic">Nenhum resultado encontrado.</p>
                <button onClick={resetFilters} className="mt-4 text-sm font-black underline uppercase">Limpar Filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {wheelGroups.map((group) => (
                  <Link key={group.id} to={`/roda/${group.wheels[0].id}`}>
                    <WheelCard group={group} onClick={() => { }} />
                  </Link>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="py-20 flex justify-center">
              {(loadingMore || loading) && <Loader2 className="w-10 h-10 animate-spin text-black" />}
            </div>
          </div>
        </div>
      </main>

      {/* CORREÇÃO DO FILTRO MOBILE */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[320px] bg-white p-6 shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase italic">Filtros</h2>
              <button 
                onClick={() => setIsFilterModalOpen(false)} 
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-grow">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
                models={filterOptions.models}
                boltPatterns={filterOptions.boltPatterns}
                finishes={filterOptions.finishes}
              />
            </div>

            {/* BOTÃO PARA FECHAR E VER RESULTADOS */}
            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full mt-6 bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest sticky bottom-0"
            >
              Ver {rawWheels.length} Resultados
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CatalogPage;
