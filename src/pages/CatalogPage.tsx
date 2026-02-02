import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WheelCard from "../features/wheels/WheelCard";
import FilterSidebar from "../features/wheels/FilterSidebar";

import { FilterState } from "../types/wheel";
import { SlidersHorizontal, Search, X, Loader2 } from "lucide-react";
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

  const [filters, setFilters] = useState<FilterState>({
    search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "",
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
      if (filters.size) query = query.eq('size', filters.size.replace("Aro ", "").trim());
      if (filters.search) query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      if (filters.defectType) query = query.contains('defects', [filters.defectType]);

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

  useEffect(() => {
    const timer = setTimeout(() => loadWheels(true), filters.search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [filters, loadWheels]);

  useEffect(() => {
    async function loadFilterOptions() {
      const { data } = await supabase.from("individual_wheels").select("model, bolt_pattern, finish");
      if (data) {
        setFilterOptions({
          models: [...new Set(data.map(r => r.model))].filter(Boolean).sort() as string[],
          boltPatterns: [...new Set(data.map(r => r.bolt_pattern))].filter(Boolean).sort() as string[],
          finishes: [...new Set(data.map(r => r.finish))].filter(Boolean).sort() as string[],
        });
      }
    }
    loadFilterOptions();
  }, []);

  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="flex-grow pt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterSidebar
              filters={filters} setFilters={setFilters} 
              onReset={() => setFilters({ search: "", model: "", size: "", boltPattern: "", finish: "", defectType: "" })}
              models={filterOptions.models} boltPatterns={filterOptions.boltPatterns} finishes={filterOptions.finishes}
            />
          </aside>

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  className="w-full pl-12 pr-4 py-4 bg-white shadow-sm rounded-2xl outline-none"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {wheelGroups.map((group) => (
                <Link key={group.id} to={`/roda/${group.id}`}>
                  <WheelCard group={group} />
                </Link>
              ))}
            </div>
            
            <div ref={loadMoreRef} className="py-12 flex justify-center">
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
