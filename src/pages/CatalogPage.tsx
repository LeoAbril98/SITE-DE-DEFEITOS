import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WheelCard from '../features/wheels/WheelCard';
import FilterSidebar from '../features/wheels/FilterSidebar';
import WheelDetail from '../features/wheels/WheelDetail';

import { FilterState, WheelGroup } from '../types/wheel';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { groupWheels } from '../features/wheels/wheelGroupAdapter';

const CatalogPage: React.FC = () => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [wheelGroups, setWheelGroups] = useState<WheelGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [filters, setFilters] = useState<FilterState>({
        search: '',
        model: '',
        size: '',
        boltPattern: '',
        finish: '',
        defectType: '',
    });

    /* =========================
    CORREÇÃO DE SCROLL TOP
   ========================= */
    useEffect(() => {
        // Se houver um grupo selecionado, rola a página para o topo instantaneamente
        if (selectedGroupId) {
            window.scrollTo(0, 0);
        }
    }, [selectedGroupId]); // Executa sempre que o ID selecionado mudar

    /* =========================
       LOAD FROM SUPABASE
       ========================= */
    useEffect(() => {
        async function loadWheels() {
            const { data, error } = await supabase
                .from('individual_wheels')
                .select('*');

            if (error) {
                console.error('Erro ao buscar rodas:', error);
                setWheelGroups([]);
            } else {
                setWheelGroups(groupWheels(data ?? []));
            }

            setLoading(false);
        }

        loadWheels();
    }, []);

    /* =========================
       DYNAMIC FILTER OPTIONS
       ========================= */
    const availableModels = useMemo(() => {
        return Array.from(new Set(wheelGroups.map(g => g.model))).sort();
    }, [wheelGroups]);

    const availableBoltPatterns = useMemo(() => {
        return Array.from(new Set(wheelGroups.map(g => g.boltPattern))).sort();
    }, [wheelGroups]);

    const availableFinishes = useMemo(() => {
        return Array.from(new Set(wheelGroups.map(g => g.finish))).sort();
    }, [wheelGroups]);

    /* =========================
       FILTERED GROUPS
       ========================= */
    const filteredGroups = useMemo(() => {
        // 1. Primeiro filtramos os dados como você já faz
        const filtered = wheelGroups.filter((group) => {
            const matchesSearch =
                !filters.search ||
                group.model.toLowerCase().includes(filters.search.toLowerCase()) ||
                group.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
                group.finish.toLowerCase().includes(filters.search.toLowerCase());

            const matchesModel = !filters.model || group.model === filters.model;

            const matchesSize =
                !filters.size ||
                group.size === filters.size ||
                group.size.startsWith(filters.size.replace('Aro ', ''));

            const matchesBoltPattern =
                !filters.boltPattern || group.boltPattern === filters.boltPattern;

            const matchesFinish =
                !filters.finish || group.finish === filters.finish;

            const matchesDefect =
                !filters.defectType ||
                group.defectTags.includes(filters.defectType);

            return (
                matchesSearch &&
                matchesModel &&
                matchesSize &&
                matchesBoltPattern &&
                matchesFinish &&
                matchesDefect
            );
        });

        // 2. Agora aplicamos a ordenação alfabética pelo nome do MODELO
        return filtered.sort((a, b) => a.model.localeCompare(b.model));

    }, [filters, wheelGroups]);

    const selectedGroup = wheelGroups.find(g => g.id === selectedGroupId);

    const resetFilters = () => {
        setFilters({
            search: '',
            model: '',
            size: '',
            boltPattern: '',
            finish: '',
            defectType: '',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Carregando rodas...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
            <Header />

            <main className="flex-grow pt-16">
                {selectedGroupId && selectedGroup ? (
                    <WheelDetail
                        group={selectedGroup}
                        onBack={() => setSelectedGroupId(null)}
                    />
                ) : (
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">

                        {/* SIDEBAR DESKTOP */}
                        <aside className="hidden lg:block w-64 shrink-0">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                onReset={resetFilters}
                                models={availableModels}
                                boltPatterns={availableBoltPatterns}
                                finishes={availableFinishes}
                            />
                        </aside>

                        <div className="flex-grow">
                            {/* SEARCH + MOBILE FILTER */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por modelo, aro ou defeito..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilters(prev => ({ ...prev, search: e.target.value }))
                                        }
                                    />
                                </div>

                                <button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className="lg:hidden flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    Filtros
                                </button>
                            </div>

                            {/* GRID */}
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
                                <div className="text-center py-24 bg-white border border-gray-100 rounded-xl">
                                    <p className="text-gray-500 mb-2">
                                        Nenhuma roda corresponde aos filtros selecionados.
                                    </p>
                                    <button
                                        onClick={resetFilters}
                                        className="text-black font-semibold hover:underline"
                                    >
                                        Limpar todos os filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* FILTER MODAL MOBILE */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-bold">Filtros</h2>
                        <button onClick={() => setIsFilterModalOpen(false)}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4">
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            onReset={resetFilters}
                            models={availableModels}
                            boltPatterns={availableBoltPatterns}
                            finishes={availableFinishes}
                        />
                    </div>

                    <div className="p-4 border-t">
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full py-4 bg-black text-white rounded-lg font-semibold"
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
