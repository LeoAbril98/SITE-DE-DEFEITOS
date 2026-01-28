import React, { useEffect, useMemo, useRef, useState } from "react";
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
const OPTIONS_PAGE_SIZE = 1000; // para carregar opções do filtro (colunas leves)
const ALL_PAGE_SIZE = 500; // para carregar tudo quando filtra (pode ajustar)

const CatalogPage: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // GRID (paginado / ou completo quando filtra)
  const [rawWheels, setRawWheels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal mobile
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Paginação do grid
  const [hasMore, setHasMore] = useState(true);

  // Opções completas do filtro (não dependem do grid paginado)
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

  // Infinite scroll target
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Locks
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);

  // Controle: entrou/saiu do modo filtrando
  const wasFilteringRef = useRef(false);
  const allLoadedForFilteringRef = useRef(false);

  const isFiltering = Boolean(
    filters.search ||
      filters.model ||
      filters.size ||
      filters.boltPattern ||
      filters.finish ||
      filters.defectType
  );

  /* =========================
     GRID: LOAD PAGINADO
     ========================= */
  async function loadWheels(isInitial = false) {
    if (fetchingRef.current) return;
    if (!isInitial && !hasMore) return;

    fetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
        setHasMore(true);
        pageRef.current = 0;
        allLoadedForFilteringRef.current = false; // voltou para paginado
      } else {
        setLoadingMore(true);
      }

      const from = pageRef.current * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("individual_wheels")
        .select("*")
        .order("model", { ascending: true })
        .range(from, to);

      if (error) {
        console.error("Erro ao buscar rodas:", error);
        return;
      }

      const rows = data ?? [];

      setRawWheels((prev) => (isInitial ? rows : [...prev, ...rows]));

      if (rows.length > 0) pageRef.current += 1;

      setHasMore(rows.length === ITEMS_PER_PAGE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }

  /* =========================
     OPÇÕES DO FILTRO: LOAD COMPLETO (LEVE)
     - NÃO depende da paginação do grid
     ========================= */
  async function loadFilterOptions() {
    try {
      const all: any[] = [];
      let page = 0;

      while (true) {
        const from = page * OPTIONS_PAGE_SIZE;
        const to = from + OPTIONS_PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from("individual_wheels")
          .select("model, bolt_pattern, finish")
          .order("model", { ascending: true })
          .range(from, to);

        if (error) {
          console.error("Erro ao buscar opções do filtro:", error);
          break;
        }

        const rows = data ?? [];
        all.push(...rows);

        if (rows.length < OPTIONS_PAGE_SIZE) break;

        page += 1;
      }

      const models = [...new Set(all.map((r) => r.model).filter(Boolean))].sort();
      const boltPatterns = [
        ...new Set(all.map((r) => r.bolt_pattern).filter(Boolean)),
      ].sort();
      const finishes = [...new Set(all.map((r) => r.finish).filter(Boolean))].sort();

      setFilterOptions({ models, boltPatterns, finishes });
    } catch (e) {
      console.error("Erro inesperado ao montar opções do filtro:", e);
    }
  }

  /* =========================
     LOAD TUDO PARA FILTRAR/BUSCAR (UMA VEZ)
     ========================= */
  async function loadAllWheelsForFiltering() {
    if (fetchingRef.current) return;
    if (allLoadedForFilteringRef.current) return; // já carregou tudo

    fetchingRef.current = true;
    setLoading(true);

    try {
      const all: any[] = [];
      let page = 0;

      while (true) {
        const from = page * ALL_PAGE_SIZE;
        const to = from + ALL_PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from("individual_wheels")
          .select("*")
          .order("model", { ascending: true })
          .range(from, to);

        if (error) {
          console.error("Erro ao buscar rodas (all):", error);
          break;
        }

        const rows = data ?? [];
        all.push(...rows);

        if (rows.length < ALL_PAGE_SIZE) break;
        page += 1;
      }

      setRawWheels(all);

      // Em modo "all", não tem infinite scroll
      setHasMore(false);
      pageRef.current = 0;

      allLoadedForFilteringRef.current = true;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }

  // Carregamento inicial
  useEffect(() => {
    loadWheels(true);
    loadFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     Alterna modo:
     - entrou em filtros => carrega tudo para busca/filtro não ficar limitado
     - saiu dos filtros => volta paginado
     ========================= */
  useEffect(() => {
    // entrou em modo filtro
    if (isFiltering && !wasFilteringRef.current) {
      wasFilteringRef.current = true;
      loadAllWheelsForFiltering();
      return;
    }

    // saiu do modo filtro (limpou tudo)
    if (!isFiltering && wasFilteringRef.current) {
      wasFilteringRef.current = false;
      loadWheels(true); // volta paginado
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFiltering]);

  /* =========================
     INFINITE SCROLL OBSERVER
     - pausa quando filtrando
     ========================= */
  useEffect(() => {
    if (isFiltering) return;

    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        if (hasMore && !loadingMore && !loading) {
          loadWheels(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, loading, isFiltering]);

  // Scroll para o topo ao detalhar
  useEffect(() => {
    if (selectedGroupId) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedGroupId]);

  /* =========================
     LÓGICA DE FILTROS E GRUPOS
     ========================= */
  const wheelGroups = useMemo(() => groupWheels(rawWheels), [rawWheels]);

  const filteredGroups = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return wheelGroups
      .filter((group) => {
        const matchesSearch =
          !search ||
          group.model.toLowerCase().includes(search) ||
          group.finish.toLowerCase().includes(search) ||
          group.size.toLowerCase().includes(search) ||
          group.boltPattern.toLowerCase().includes(search);

        const matchesModel = !filters.model || group.model === filters.model;

        const sizeFilter = (filters.size || "").replace("Aro ", "").trim();
        const matchesSize = !sizeFilter || group.size.includes(sizeFilter);

        const matchesBoltPattern =
          !filters.boltPattern || group.boltPattern === filters.boltPattern;

        const matchesFinish = !filters.finish || group.finish === filters.finish;

        const matchesDefect =
          !filters.defectType ||
          (group.defectTags ?? []).includes(filters.defectType);

        return (
          matchesSearch &&
          matchesModel &&
          matchesSize &&
          matchesBoltPattern &&
          matchesFinish &&
          matchesDefect
        );
      })
      .sort((a, b) => a.model.localeCompare(b.model));
  }, [filters, wheelGroups]);

  const selectedGroup = wheelGroups.find((g) => g.id === selectedGroupId);

  const resetFilters = () => {
    setFilters({
      search: "",
      model: "",
      size: "",
      boltPattern: "",
      finish: "",
      defectType: "",
    });
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
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
                models={filterOptions.models}
                boltPatterns={filterOptions.boltPatterns}
                finishes={filterOptions.finishes}
              />
            </aside>

            <div className="flex-grow">
              {/* BUSCA */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="O que você está procurando? (Modelo, aro...)"
                    className="w-full pl-12 pr-4 py-4 bg-white border-0 shadow-sm rounded-2xl focus:ring-2 focus:ring-black transition-all text-sm font-medium"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }
                  />
                </div>

                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-2 px-6 py-4 bg-white shadow-sm rounded-2xl text-sm font-bold uppercase tracking-wider"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filtros
                </button>
              </div>

              {/* CONTADOR */}
              {!loading && (
                <div className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">
                  {filteredGroups.length} modelo(s) encontrado(s)
                  {isFiltering ? " (filtrado)" : ""}
                </div>
              )}

              {/* LOADING */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 animate-pulse rounded-2xl aspect-[4/5]"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredGroups.map((group) => (
                        <WheelCard
                          key={group.id}
                          group={group}
                          onClick={() => setSelectedGroupId(group.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl">
                      <p className="text-gray-500 font-medium mb-4">
                        Nenhum resultado encontrado para sua busca.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="px-6 py-2 bg-black text-white rounded-full text-sm font-bold"
                      >
                        Limpar tudo
                      </button>
                    </div>
                  )}

                  {/* TRIGGER DO INFINITE SCROLL */}
                  <div ref={loadMoreRef} className="py-12 flex justify-center">
                    {isFiltering ? (
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                        Infinite scroll pausado durante filtros
                      </p>
                    ) : (
                      <>
                        {loadingMore && (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-black" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Carregando mais
                            </p>
                          </div>
                        )}

                        {!hasMore && filteredGroups.length > 0 && (
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                            Você chegou ao fim do estoque
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* BOTÃO "CARREGAR MAIS" */}
                  {!isFiltering && hasMore && !loadingMore && (
                    <div className="flex justify-center pb-8">
                      <button
                        onClick={() => loadWheels(false)}
                        className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50"
                      >
                        Carregar mais
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL MOBILE */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-black uppercase italic">Filtros</h2>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="p-2 bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
              models={filterOptions.models}
              boltPatterns={filterOptions.boltPatterns}
              finishes={filterOptions.finishes}
            />
          </div>

          <div className="p-6 border-t">
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest"
            >
              Ver Resultados
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CatalogPage;
