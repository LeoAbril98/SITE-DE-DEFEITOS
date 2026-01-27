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
    
    // Estados para Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    async function loadWheels() {
        setLoading(true);
        
        // 1. Calcular o intervalo para o Supabase
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        // 2. Buscar dados com range e count total
        const { data, error, count } = await supabase
            .from('individual_wheels')
            .select('*', { count: 'exact' }) // Pega o total de registros no banco
            .order('created_at', { ascending: false })
            .range(from, to);

        if (!error && data) {
            setWheels(data);
            if (count !== null) setTotalCount(count);
        }
        setLoading(false);
    }

    // Recarregar sempre que a página mudar
    useEffect(() => {
        loadWheels();
    }, [currentPage]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // ... (Funções removeWheel, handleEdit, handleAddNew permanecem as mesmas)
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

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            {/* Header omitido para brevidade, mantenha o seu original */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">Admin</h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                        Total: {totalCount} rodas
                    </p>
                </div>
                <button onClick={handleAddNew} className="px-6 py-3 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
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
                            // ... Seu mapeamento de URL de imagem original aqui ...
                            const folder = w.model.toLowerCase().trim().replace(/\s+/g, '');
                            const fileName = resolveFinishImage(w.finish);
                            const catalogPhotoUrl = fileName ? `/modelos/${folder}/${fileName}` : `/modelos/${folder}/CAPA.jpg`;

                            return (
                                <div key={w.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-black/5 transition-all shadow-sm">
                                    {/* ... Conteúdo do Card Original ... */}
                                    <div className="flex gap-6 items-start">
                                        <img src={catalogPhotoUrl} className="w-24 h-24 object-cover rounded-xl" alt="Roda" />
                                        <div className="flex-1">
                                            <p className="font-black text-lg uppercase">{w.model}</p>
                                            <p className="text-xs font-bold text-blue-600">{w.finish}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(w)} className="p-3">✏️</button>
                                            <button onClick={() => removeWheel(w.id)} className="p-3">🗑️</button>
                                        </div>
                                    </div>
                                    {/* Mídias (Fotos/Vídeos) aqui embaixo... */}
                                </div>
                            );
                        })}
                    </div>

                    {/* CONTROLES DE PAGINAÇÃO */}
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold disabled:opacity-30"
                        >
                            Anterior
                        </button>
                        
                        <span className="font-black text-sm uppercase">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold disabled:opacity-30"
                        >
                            Próxima
                        </button>
                    </div>
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
