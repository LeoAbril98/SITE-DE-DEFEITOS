import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";
import WheelDetail from "../features/wheels/WheelDetail";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";

const ITEMS_PER_PAGE = 12;

const CatalogPage: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
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
      
      if (filters.size) {
        const sizeVal = filters.size.replace("Aro ", "").trim();
        query = query.eq('size', sizeVal);
      }

      if (filters.search) {
        query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.defectType) {
        query = query.contains('defects', [filters.defectType]);
      }

      // ORDEM ALFABÉTICA PELO MODELO
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

  async function loadFilterOptions() {
    try {
      const { data } = await supabase
        .from("individual_wheels")
        .select("model, bolt_pattern, finish");

      if (data) {
        const models = [...new Set(data.map(r => r.model))].filter(Boolean).sort() as string[];
        const boltPatterns = [...new Set(data.map(r => r.bolt_pattern))].filter(Boolean).sort() as string[];
        const finishes = [...new Set(data.map(r => r.finish))].filter(Boolean).sort() as string[];
        setFilterOptions({ models, boltPatterns, finishes });
      }
    } catch (e) {
      console.error("Erro nas opções de filtro:", e);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWheels(true);
    }, filters.search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [filters, loadWheels]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadWheels(false);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadWheels]);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);
  const selectedGroup = wheelGroups.find((g) => g.id === selectedGroupId);

  const resetFilters = () => {
    setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" });
    setIsFilterModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="flex-grow pt-16">
        {selectedGroupId && selectedGroup ? (
          <WheelDetail group={selectedGroup} onBack={() => setSelectedGroupId(null)} />
        ) : (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterSidebar
                filters={filters} setFilters={setFilters} onReset={resetFilters}
                models={filterOptions.models} boltPatterns={filterOptions.boltPatterns} finishes={filterOptions.finishes}
              />
            </aside>

            <div className="flex-grow">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por modelo ou descrição..."
                    className="w-full pl-12 pr-4 py-4 bg-white shadow-sm rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-sm font-medium"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <button onClick={() => setIsFilterModalOpen(true)} className="lg:hidden flex items-center justify-center gap-2 px-6 py-4 bg-white shadow-sm rounded-2xl text-sm font-bold uppercase">
                  <SlidersHorizontal className="w-4 h-4" /> Filtros
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-2xl aspect-[4/5]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wheelGroups.map((group) => (
                    <WheelCard key={group.id} group={group} onClick={() => setSelectedGroupId(group.id)} />
                  ))}
                </div>
              )}

              <div ref={loadMoreRef} className="py-12 flex flex-col items-center justify-center">
                {loadingMore && <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />}
                {!hasMore && !loading && wheelGroups.length > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Fim dos resultados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CatalogPage;
