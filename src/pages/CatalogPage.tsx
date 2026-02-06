import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2, RotateCcw, ChevronDown } from "lucide-react";
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

  // Novo estado para controlar a expansão do filtro no mobile
  const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  /* 1) CARREGAR OPÇÕES (DINÂMICO) */
  const loadFilterOptions = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("individual_wheels")
        .select("model, bolt_pattern, finish")
        .is("deleted_at", null);

      if (data) {
        setFilterOptions({
          models: [...new Set(data.map((r) => r.model))].filter(Boolean).sort() as string[],
          boltPatterns: [...new Set(data.map((r) => r.bolt_pattern))].filter(Boolean).sort() as string[],
          finishes: [...new Set(data.map((r) => r.finish))].filter(Boolean).sort() as string[],
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  /* 2) CARREGAR RODAS (ORDEM: MODELO > ARO > FURAÇÃO) */
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
        if (filters.search) query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        if (filters.defectType) query = query.contains("defects", [filters.defectType]);

        const { data, error } = await query
          .order("model", { ascending: true })
          .order("size", { ascending: true })
          .order("bolt_pattern", { ascending: true })
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
      } catch (err) { console.error(err); } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        fetchingRef.current = false;
      }
    },
    [filters]
  );

  useEffect(() => { loadWheels(true); }, [filters, loadWheels]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) loadWheels(false);
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadWheels]);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  const resetFilters = () => {
    setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR DESKTOP (Inalterada) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters} setFilters={setFilters} onReset={resetFilters}
                models={filterOptions.models} boltPatterns={filterOptions.boltPatterns} finishes={filterOptions.finishes}
              />
            </div>
          </aside>

          <div className="flex-grow min-w-0">
            {/* BARRA DE BUSCA E TOGGLE MOBILE */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar modelo..."
                    className="w-full pl-12 pr-4 py-4 bg-white shadow-sm rounded-2xl outline-none focus:ring-2 focus:ring-black font-bold italic"
                    value={filters.search}
                    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <button
                  onClick={() => setIsMobileFilterVisible(!isMobileFilterVisible)}
                  className={`lg:hidden flex items-center justify-center px-6 rounded-2xl border transition-all ${isMobileFilterVisible ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* NOVO FILTRO TIPO "ACCORDION" PARA MOBILE */}
              {isMobileFilterVisible && (
                <div className="lg:hidden bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black uppercase italic text-sm">Ajustar Filtros</h3>
                    <button onClick={resetFilters} className="text-[10px] font-bold uppercase underline">Limpar</button>
                  </div>
                  
                  {/* Reutilizamos o componente, mas dentro deste container ele fluirá naturalmente */}
                  <FilterSidebar
                    filters={filters} setFilters={setFilters} onReset={resetFilters}
                    models={filterOptions.models} boltPatterns={filterOptions.boltPatterns} finishes={filterOptions.finishes}
                  />
                  
                  <button 
                    onClick={() => setIsMobileFilterVisible(false)}
                    className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Fechar e Ver Resultados
                  </button>
                </div>
              )}
            </div>

            {/* GRID DE CARDS */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white rounded-[2rem] animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {wheelGroups.map((group) => (
                  <Link key={group.id} to={`/roda/${group.wheels[0].id}`}>
                    <WheelCard group={group} onClick={() => {}} />
                  </Link>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="py-10 flex justify-center">
              {loadingMore && <Loader2 className="animate-spin" />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CatalogPage;
