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

  /* 1) CARREGAR OPÇÕES DE FILTRO */
  const loadFilterOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("individual_wheels")
        .select("model, bolt_pattern, finish")
        .is("deleted_at", null);

      if (error) throw error;
      if (data) {
        setFilterOptions({
          models: [...new Set(data.map((r: any) => r.model))].filter(Boolean).sort() as string[],
          boltPatterns: [...new Set(data.map((r: any) => r.bolt_pattern))].filter(Boolean).sort() as string[],
          finishes: [...new Set(data.map((r: any) => r.finish))].filter(Boolean).sort() as string[],
        });
      }
    } catch (e) {
      console.error("Erro nas opções de filtro:", e);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  /* 2) CARREGAR RODAS COM LOGICA DE FILTRO CORRIGIDA */
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

        let query = supabase
          .from("individual_wheels")
          .select("*")
          .is("deleted_at", null);

        // Filtros Exatos
        if (filters.model) query = query.eq("model", filters.model);
        if (filters.boltPattern) query = query.eq("bolt_pattern", filters.boltPattern);
        if (filters.finish) query = query.eq("finish", filters.finish);
        
        // Filtro de Tamanho (Aro) - Usa LIKE para encontrar o número
        if (filters.size) query = query.ilike("size", `%${filters.size}%`);
        
        // Busca Global
        if (filters.search) {
          query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Filtro de Defeitos (Ajustado para Array ou Texto)
        if (filters.defectType) {
          query = query.contains("defects", [filters.defectType]);
        }

        const { data, error } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (myRequestId !== requestIdRef.current) return;

        const rows = data ?? [];
        setRawWheels((prev) => (isInitial ? rows : [...prev, ...rows]));
        setHasMore(rows.length === ITEMS_PER_PAGE);
        if (rows.length > 0) pageRef.current += 1;
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWheels(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters, loadWheels]);

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
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />

      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters} setFilters={setFilters} onReset={resetFilters}
                models={filterOptions.models} boltPatterns={filterOptions.boltPatterns} finishes={filterOptions.finishes}
              />
            </div>
          </aside>

          <div className="flex-grow min-w-0">
            {/* Barra de Busca e Botão Filtro Mobile */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar modelo ou descrição..."
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

            {/* Badges de Filtros Ativos */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
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
              {Object.values(filters).some((v, i) => Object.keys(filters)[i] !== 'search' && v !== "") && (
                <button onClick={resetFilters} className="text-[10px] font-black uppercase text-gray-400 hover:text-black flex items-center gap-1 ml-2 transition-colors">
                  <RotateCcw size={12} /> Limpar Tudo
                </button>
              )}
            </div>

            {/* Listagem de Cards */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <WheelCardSkeleton key={i} />)}
              </div>
            ) : wheelGroups.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                 <p className="text-gray-400 font-medium">Nenhuma roda encontrada com esses filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {wheelGroups.map((group) => (
                  <Link key={group.id} to={`/roda/${group.wheels[0].id}`} className="group transition-transform hover:-translate-y-1">
                    <WheelCard group={group} onClick={() => { }} />
                  </Link>
                ))}
              </div>
            )}

            {/* Infinite Scroll Loader */}
            <div ref={loadMoreRef} className="py-20 flex justify-center">
              {loadingMore && <Loader2 className="w-10 h-10 animate-spin text-black" />}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE FILTRO MOBILE */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsFilterModalOpen(false)} 
          />
          <div className="absolute right-0 top-0 h-full w-[300px] bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Filtros</h2>
              <button 
                onClick={() => setIsFilterModalOpen(false)} 
                className="p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <FilterSidebar
              filters={filters} 
              setFilters={setFilters} 
              onReset={resetFilters}
              models={filterOptions.models} 
              boltPatterns={filterOptions.boltPatterns} 
              finishes={filterOptions.finishes}
            />

            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full mt-10 bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const WheelCardSkeleton = () => (
  <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
    <div className="aspect-square bg-gray-100 rounded-[2rem] animate-pulse" />
    <div className="h-4 w-1/2 bg-gray-100 rounded mx-auto animate-pulse" />
  </div>
);

export default CatalogPage;
