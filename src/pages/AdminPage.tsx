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

    // Estados para Controle de Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    async function loadWheels() {
        setLoading(true);
        
        // Cálculo do intervalo para o Supabase
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await supabase
            .from('individual_wheels')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (!error && data) {
            setWheels(data);
            if (count !== null) setTotalCount(count);
        }
        setLoading(false);
    }

    async function removeWheel(id: string) {
        const ok = confirm('Remover esta roda do estoque?');
        if (!ok) return;

        await supabase.from('individual_wheels').delete().eq('id', id);
        // Se deletar o último item da página, volta uma página
        if (wheels.length === 1 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        } else {
            loadWheels();
        }
    }

    function handleEdit(wheel: IndividualWheel) {
        setSelectedWheel(wheel);
        setIsModalOpen(true);
    }

    function handleAddNew() {
        setSelectedWheel(null);
        setIsModalOpen(true);
    }

    useEffect(() => {
        loadWheels();
    }, [currentPage]); // Recarrega sempre que mudar a página

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">Admin</h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                        Gerenciamento de Estoque ({totalCount} itens)
                    </p>
                </div>

                <button
                    onClick={handleAddNew}
                    className="px-6 py-3 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
                >
                    + Adicionar roda
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {wheels.map((w, index) => {
                            const folder = w.model.toLowerCase().trim().replace(/\s+/g, '');
                            const fileName = resolveFinishImage(w.finish);
                            const catalogPhotoUrl = fileName
                                ? `/modelos/${folder}/${fileName}`
                                : `/modelos/${folder}/CAPA.jpg`;

                            // Cálculo do número real do item (considerando a página)
                            const displayIndex = totalCount - ((currentPage - 1) * ITEMS_PER_PAGE + index);

                            return (
                                <div
                                    key={w.id}
                                    className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-black/5 transition-all shadow-sm"
                                >
                                    <div className="flex gap-6 items-start">
                                        <div className="relative group">
                                            <img
                                                src={catalogPhotoUrl}
                                                alt="Capa"
                                                className="w-24 h-24 object-cover rounded-xl border-2 border-gray-50 shadow-sm"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    if (w.photos && w.photos.length > 0) {
                                                        target.src = w.photos[0];
                                                    } else {
                                                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3C/svg%3E";
                                                    }
                                                }}
                                            />
                                            <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase">
                                                Catálogo
                                            </span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">#{displayIndex}</span>
                                                <p className="font-black text-lg uppercase tracking-tight">{w.model}</p>
                                            </div>

                                            <p className="text-xs font-bold text-blue-600 uppercase mb-2">{w.finish}</p>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Aro {w.size} • {w.bolt_pattern} • Offset {w.wheel_offset}
                                            </p>

                                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                                {w.defects?.map(d => (
                                                    <span key={d} className="text-[9px] px-2 py-1 bg-red-50 text-red-500 border border-red-100 rounded-md font-black uppercase">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(w)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Editar Roda">
                                                <span className="text-xl">✏️</span>
                                            </button>
                                            <button onClick={() => removeWheel(w.id)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir Roda">
                                                <span className="text-xl">🗑️</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* FOTOS REAIS */}
                                        {w.photos && w.photos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fotos Reais</p>
                                                <div className="flex gap-3 overflow-x-auto pb-2">
                                                    {w.photos.map((url, i) => (
                                                        <div key={i} className="relative flex-shrink-0">
                                                            <img src={url} alt={`Real ${i}`} className="w-20 h-20 object-cover rounded-lg border shadow-sm" />
                                                            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">{i + 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* VÍDEO */}
                                        {w.video_url && (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-blue-500">Vídeo de Inspeção</p>
                                                <div className="relative w-full max-w-[200px] aspect-video bg-black rounded-lg overflow-hidden shadow-sm border-2 border-blue-50">
                                                    <video src={w.video_url} controls preload="none" className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* BARRA DE NAVEGAÇÃO ENTRE PÁGINAS */}
                    <div className="mt-10 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(1); window.scrollTo(0,0); }}
                                className="p-2 text-xs font-bold uppercase disabled:opacity-30"
                            >
                                First
                            </button>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}
                                className="px-4 py-2 bg-white border-2 border-gray-100 rounded-xl font-black hover:border-black transition-all disabled:opacity-30"
                            >
                                ←
                            </button>
                            
                            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-xl">
                                <span className="text-xs font-black uppercase tracking-widest">
                                    Página {currentPage} de {totalPages}
                                </span>
                            </div>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
                                className="px-4 py-2 bg-white border-2 border-gray-100 rounded-xl font-black hover:border-black transition-all disabled:opacity-30"
                            >
                                →
                            </button>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => { setCurrentPage(totalPages); window.scrollTo(0,0); }}
                                className="p-2 text-xs font-bold uppercase disabled:opacity-30"
                            >
                                Last
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Mostrando {wheels.length} de {totalCount} rodas
                        </p>
                    </div>
                </>
            )}

            {isModalOpen && (
                <AddWheelModal
                    wheelToEdit={selectedWheel}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedWheel(null);
                    }}
                    onSaved={loadWheels}
                />
            )}
        </div>
    );
};

export default AdminPage;
