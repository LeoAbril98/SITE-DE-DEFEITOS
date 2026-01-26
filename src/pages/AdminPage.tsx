import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IndividualWheel } from '../types/wheel';
import AddWheelModal from '../features/admin/add-wheel/AddWheelModal';
// A função resolveFinishImage agora extrai o código de dentro dos parênteses automaticamente
import { resolveFinishImage } from '../utils/finishResolver';

const AdminPage: React.FC = () => {
    const [wheels, setWheels] = useState<IndividualWheel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWheel, setSelectedWheel] = useState<IndividualWheel | null>(null);

    async function loadWheels() {
        setLoading(true);
        const { data, error } = await supabase
            .from('individual_wheels')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setWheels(data);
        }
        setLoading(false);
    }

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

    useEffect(() => {
        loadWheels();
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase italic">Admin</h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Gerenciamento de Estoque Individual</p>
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
                <div className="space-y-4">
                    {wheels.map((w, index) => {
                        const folder = w.model.toLowerCase().trim().replace(/\s+/g, '');

                        // NOVO: A função resolveFinishImage agora retorna "CÓDIGO.jpg" extraído dos parênteses
                        const fileName = resolveFinishImage(w.finish);

                        // Montagem da URL usando o nome do arquivo extraído ou caindo para a CAPA padrão
                        const catalogPhotoUrl = fileName
                            ? `/modelos/${folder}/${fileName}`
                            : `/modelos/${folder}/CAPA.jpg`;

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
                                                // Se não achar no catálogo, tenta a primeira foto real do upload
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
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">#{wheels.length - index}</span>
                                            <p className="font-black text-lg uppercase tracking-tight">
                                                {w.model}
                                            </p>
                                        </div>

                                        <p className="text-xs font-bold text-blue-600 uppercase mb-2">
                                            {w.finish}
                                        </p>

                                        <p className="text-sm text-gray-500 font-medium">
                                            Aro {w.size} • {w.bolt_pattern} • Offset {w.wheel_offset}
                                        </p>

                                        <div className="flex gap-1.5 mt-3 flex-wrap">
                                            {w.defects?.map(d => (
                                                <span
                                                    key={d}
                                                    className="text-[9px] px-2 py-1 bg-red-50 text-red-500 border border-red-100 rounded-md font-black uppercase"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(w)}
                                            className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Editar Roda"
                                        >
                                            <span className="text-xl">✏️</span>
                                        </button>
                                        <button
                                            onClick={() => removeWheel(w.id)}
                                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Excluir Roda"
                                        >
                                            <span className="text-xl">🗑️</span>
                                        </button>
                                    </div>
                                </div>

                                {/* SEÇÃO DE MÍDIA (FOTOS E VÍDEO) */}
                                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* COLUNA FOTOS REAIS */}
                                    {w.photos && w.photos.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fotos Reais</p>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {w.photos.map((url, i) => (
                                                    <div key={i} className="relative flex-shrink-0">
                                                        <img
                                                            src={url}
                                                            alt={`Real ${i}`}
                                                            className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                                                        />
                                                        <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">
                                                            {i + 1}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* COLUNA VÍDEO */}
                                    {w.video_url && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-blue-500">Vídeo de Inspeção</p>
                                            <div className="relative w-full max-w-[200px] aspect-video bg-black rounded-lg overflow-hidden shadow-sm border-2 border-blue-50">
                                                <video
                                                    src={w.video_url}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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