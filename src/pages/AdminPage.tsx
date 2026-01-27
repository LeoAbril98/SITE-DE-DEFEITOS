import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IndividualWheel } from '../types/wheel';
import AddWheelModal from '../features/admin/add-wheel/AddWheelModal';
import { resolveFinishImage } from '../utils/finishResolver';

const ITEMS_PER_PAGE = 10;

const AdminPage: React.FC = () => {
    const [wheels, setWheels] = useState<IndividualWheel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWheel, setSelectedWheel] = useState<IndividualWheel | null>(null);

    // Estados de Paginação e Busca
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeVideo, setActiveVideo] = useState<string | null>(null); // Controle de Lazy Load do vídeo

    async function loadWheels() {
        setLoading(true);
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from('individual_wheels')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filtro de Busca por Modelo (se houver texto)
        if (searchTerm) {
            query = query.ilike('model', `%${searchTerm}%`);
        }

        const { data, error, count } = await query.range(from, to);

        if (!error && data) {
            setWheels(data);
            if (count !== null) setTotalCount(count);
        }
        setLoading(false);
    }

    // Recarregar quando mudar página OU quando a busca mudar
    useEffect(() => {
        // Resetar para página 1 ao buscar algo novo
        if (currentPage !== 1 && searchTerm) {
            setCurrentPage(1);
        } else {
            loadWheels();
        }
    }, [currentPage, searchTerm]);

    async function removeWheel(id: string) {
        const ok = confirm('Remover esta roda do estoque?');
        if (!ok) return;
        await supabase.from('individual_wheels').delete().eq('id', id);
        loadWheels();
    }

    function handleEdit(wheel: IndividualWheel) {
        setSelectedWheel(wheel);
        setIsModalOpen(true);
    }

    function handleAddNew() {
        setSelectedWheel(null);
        setIsModalOpen(true);
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">Admin</h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                        Estoque: {totalCount} {totalCount === 1 ? 'item' : 'itens'}
                    </p>
                </div>

                <div className="flex flex-1 max-w-md gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                        <input 
                            type="text"
                            placeholder="Buscar modelo..."
                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-black outline-none transition-all font-bold uppercase text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
                    >
                        + Adicionar
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
            ) : (
                <>
                    {wheels.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="font-black text-gray-400 uppercase">Nenhuma roda encontrada</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wheels.map((w, index) => {
                                const folder = w.model.toLowerCase().trim().replace(/\s+/g, '');
                                const fileName = resolveFinishImage(w.finish);
                                const catalogPhotoUrl = fileName ? `/modelos/${folder}/${fileName}` : `/modelos/${folder}/CAPA.jpg`;
                                const displayIndex = totalCount - ((currentPage - 1) * ITEMS_PER_PAGE + index);

                                return (
                                    <div key={w.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-black/5 transition-all shadow-sm">
                                        <div className="flex gap-6 items-start">
                                            {/* Foto de Catálogo */}
                                            <div className="relative group flex-shrink-0">
                                                <img
                                                    src={catalogPhotoUrl}
                                                    className="w-24 h-24 object-cover rounded-xl border-2 border-gray-50 shadow-sm"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (w.photos && w.photos.length > 0) target.src = w.photos[0];
                                                        else target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3C/svg%3E";
                                                    }}
                                                />
                                                <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase">Catálogo</span>
                                            </div>

                                            {/* Infos principais */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">#{displayIndex}</span>
                                                    <p className="font-black text-lg uppercase tracking-tight">{w.model}</p>
                                                </div>
                                                <p className="text-xs font-bold text-blue-600 uppercase mb-2">{w.finish}</p>
                                                <p className="text-sm text-gray-500 font-medium">Aro {w.size} • {w.bolt_pattern} • Offset {w.wheel_offset}</p>
                                                <div className="flex gap-1.5 mt-3 flex-wrap">
                                                    {w.defects?.map(d => (
                                                        <span key={d} className="text-[9px] px-2 py-1 bg-red-50 text-red-500 border border-red-100 rounded-md font-black uppercase">{d}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Ações */}
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(w)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all">✏️</button>
                                                <button onClick={() => removeWheel(w.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all">🗑️</button>
                                            </div>
                                        </div>

                                        {/* Galeria e Vídeo */}
                                        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {w.photos && w.photos.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fotos Reais</p>
                                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                                        {w.photos.map((url, i) => (
                                                            <img key={i} src={url} className="w-20 h-20 object-cover rounded-lg border shadow-sm flex-shrink-0" alt="real" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {w.video_url && (
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-blue-500">Vídeo de Inspeção</p>
                                                    <div className="relative w-full max-w-[240px] aspect-video bg-black rounded-lg overflow-hidden border-2 border-blue-50 group cursor-pointer">
                                                        {activeVideo === w.id ? (
                                                            <video src={w.video_url} controls autoPlay className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div onClick={() => setActiveVideo(w.id)} className="w-full h-full flex items-center justify-center relative">
                                                                <span className="text-3xl z-10">▶️</span>
                                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PAGINAÇÃO */}
                    {totalPages > 1 && (
                        <div className="mt-10 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => { setCurrentPage(1); window.scrollTo(0,0); }}
                                    className="px-3 py-2 text-xs font-black uppercase disabled:opacity-20"
                                >
                                    Primeira
                                </button>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}
                                    className="w-12 h-12 bg-white border-2 border-gray-100 rounded-xl font-black hover:border-black transition-all disabled:opacity-20"
                                >
                                    ←
                                </button>
                                <div className="px-6 py-2 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest">
                                    Página {currentPage} / {totalPages}
                                </div>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
                                    className="w-12 h-12 bg-white border-2 border-gray-100 rounded-xl font-black hover:border-black transition-all disabled:opacity-20"
                                >
                                    →
                                </button>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => { setCurrentPage(totalPages); window.scrollTo(0,0); }}
                                    className="px-3 py-2 text-xs font-black uppercase disabled:opacity-20"
                                >
                                    Última
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <AddWheelModal
                    wheelToEdit={selectedWheel}
                    onClose={() => { setIsModalOpen(false); setSelectedWheel(null); }}
                    onSaved={loadWheels}
                />
            )}
        </div>
    );
};

export default AdminPage;
