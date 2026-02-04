import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { IndividualWheel } from '../types/wheel';
import AddWheelModal from '../features/admin/add-wheel/AddWheelModal';
import { resolveFinishImage } from '../utils/finishResolver';
import {
    Search, Plus, Edit3, Trash2, Loader2,
    ChevronLeft, ChevronRight, ChevronsLeft,
    ChevronsRight, FilterX, Settings2, Package, RefreshCw, PlayCircle, Camera, AlertCircle
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const AdminPage: React.FC = () => {
    const [wheels, setWheels] = useState<IndividualWheel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWheel, setSelectedWheel] = useState<IndividualWheel | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAro, setFilterAro] = useState('');
    const [filterPattern, setFilterPattern] = useState('');
    const [showTrash, setShowTrash] = useState(false);

    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [availablePatterns, setAvailablePatterns] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const loadFilterOptions = useCallback(async () => {
        const { data } = await supabase.from('individual_wheels').select('size, bolt_pattern').is('deleted_at', null);
        if (data) {
            const sizes = data
                .map(item => item.size?.match(/\d+/)?.[0])
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .sort((a, b) => parseInt(a!) - parseInt(b!));
            const patterns = [...new Set(data.map(item => item.bolt_pattern))].filter(Boolean).sort();
            setAvailableSizes(sizes as string[]);
            setAvailablePatterns(patterns);
        }
    }, []);

    const loadWheels = useCallback(async () => {
        setLoading(true);
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from('individual_wheels')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (showTrash) query = query.not('deleted_at', 'is', null);
        else query = query.is('deleted_at', null);

        if (searchTerm) query = query.ilike('model', `%${searchTerm}%`);
        if (filterAro) query = query.ilike('size', `%${filterAro}%`);
        if (filterPattern) query = query.ilike('bolt_pattern', `%${filterPattern}%`);

        const { data, error, count } = await query.range(from, to);
        if (!error && data) {
            setWheels(data);
            if (count !== null) setTotalCount(count);
        }
        setLoading(false);
    }, [currentPage, searchTerm, filterAro, filterPattern, showTrash]);

    useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);
    useEffect(() => {
        const handler = setTimeout(() => { loadWheels(); }, 300);
        return () => clearTimeout(handler);
    }, [loadWheels]);

    async function handleSoftDelete(id: string) {
        const password = prompt("Digite a senha para mover para a lixeira:");
        if (password === null) return;
        if (password !== ADMIN_PASSWORD) {
            alert("Senha incorreta!");
            return;
        }
        await supabase.from('individual_wheels').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        loadWheels();
    }

    async function handleRestore(id: string) {
        await supabase.from('individual_wheels').update({ deleted_at: null }).eq('id', id);
        alert("Restaurado!");
        loadWheels();
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen bg-white font-sans">

            {/* HEADER */}
            <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 p-8 rounded-[2.5rem] text-white shadow-2xl transition-all duration-500 ${showTrash ? 'bg-red-950' : 'bg-gray-900'}`}>
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                        <Settings2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{showTrash ? 'Lixeira' : 'Estoque Admin'}</h1>
                        <p className="mt-2 text-white/50 font-bold text-[10px] uppercase tracking-widest">{showTrash ? 'Itens removidos' : `${totalCount} Itens Ativos`}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setShowTrash(!showTrash); setCurrentPage(1); }} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${showTrash ? 'bg-white text-red-950' : 'bg-white/10 text-white border border-white/20'}`}>
                        <Trash2 size={18} /> {showTrash ? 'Estoque' : 'Lixeira'}
                    </button>
                    {!showTrash && (
                        <button onClick={() => { setSelectedWheel(null); setIsModalOpen(true); }} className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                            <Plus size={20} strokeWidth={3} /> Nova Roda
                        </button>
                    )}
                </div>
            </div>

            {/* FILTROS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                <div className="md:col-span-6 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar modelo..." className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl outline-none transition-all font-bold uppercase text-sm"
                        value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="md:col-span-2">
                    <select className="w-full py-5 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-black uppercase text-xs outline-none cursor-pointer appearance-none text-center"
                        value={filterAro} onChange={(e) => { setFilterAro(e.target.value); setCurrentPage(1); }}>
                        <option value="">Aro</option>
                        {availableSizes.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
                <div className="md:col-span-3">
                    <select className="w-full py-5 px-6 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-black uppercase text-xs outline-none cursor-pointer appearance-none text-center"
                        value={filterPattern} onChange={(e) => { setFilterPattern(e.target.value); setCurrentPage(1); }}>
                        <option value="">Furação</option>
                        {availablePatterns.map(pattern => <option key={pattern} value={pattern}>{pattern}</option>)}
                    </select>
                </div>
                <button onClick={() => { setSearchTerm(''); setFilterAro(''); setFilterPattern(''); setCurrentPage(1); }} className="md:col-span-1 flex items-center justify-center bg-gray-100 hover:bg-black text-gray-400 hover:text-white rounded-3xl transition-all"><FilterX size={24} /></button>
            </div>

            {/* LISTAGEM */}
            {loading && wheels.length === 0 ? (
                <div className="flex justify-center py-40"><Loader2 className="animate-spin text-black" size={40} /></div>
            ) : (
                <div className="space-y-6">
                    {wheels.map((w, index) => {
                        const folder = w.model.toLowerCase().trim().replace(/\s+/g, '');
                        const fileName = resolveFinishImage(w.finish);
                        const catalogPhotoUrl = fileName ? `/modelos/${folder}/${fileName}` : `/modelos/${folder}/CAPA.jpg`;
                        const displayIndex = totalCount - ((currentPage - 1) * ITEMS_PER_PAGE + index);

                        return (
                            <div key={w.id} className={`group border-2 rounded-[2.5rem] p-5 pr-8 transition-all flex flex-col md:flex-row items-center gap-8 shadow-sm ${showTrash ? 'bg-red-50/20 border-red-100' : 'bg-white border-gray-50 hover:border-black'}`}>

                                {/* 1. Foto Principal (Catálogo) */}
                                <div className="relative w-40 h-40 flex-shrink-0">
                                    <img src={catalogPhotoUrl} className="w-full h-full object-cover rounded-[2rem] border-4 border-gray-100 shadow-inner group-hover:rotate-2 transition-all duration-500" alt={w.model}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (w.photos && w.photos.length > 0 && !target.src.includes(w.photos[0])) target.src = w.photos[0];
                                            else target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E";
                                        }}
                                    />
                                    <div className="absolute -top-2 -left-2 bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-xl border-2 border-white shadow-xl">#{displayIndex}</div>
                                </div>

                                {/* 2. Infos Técnicas e TAGS GRANDES */}
                                <div className="flex-1 w-full text-center md:text-left space-y-4">
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{w.model}</h3>
                                        <p className="text-xs font-black text-blue-600 mt-1 uppercase tracking-widest">{w.finish}</p>
                                    </div>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="text-xs font-black uppercase bg-black text-white px-4 py-2 rounded-xl">Aro {w.size}</span>
                                        <span className="text-xs font-black uppercase bg-gray-100 text-gray-600 px-4 py-2 rounded-xl">{w.bolt_pattern}</span>
                                    </div>

                                    {/* ✅ TAGS DE DEFEITOS MAIORES */}
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        {w.defects && w.defects.length > 0 ? (
                                            w.defects.map((defect, i) => (
                                                <span key={i} className="flex items-center gap-2 text-[10px] font-black uppercase bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
                                                    <AlertCircle size={12} /> {defect}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] font-black uppercase bg-green-500 text-white px-3 py-1.5 rounded-lg">Estoque Limpo</span>
                                        )}
                                    </div>
                                </div>

                                {/* 3. MINIATURAS REAIS MAIORES */}
                                <div className="flex flex-col items-center gap-3 bg-gray-50 p-4 rounded-[2rem] border border-gray-100 min-w-[140px]">
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">Fotos Reais</p>
                                    <div className="flex -space-x-4">
                                        {w.photos && w.photos.length > 0 ? w.photos.slice(0, 3).map((url, i) => (
                                            <img key={i} src={url} className="w-16 h-16 rounded-2xl border-4 border-white object-cover shadow-lg bg-gray-200 hover:z-10 transition-all hover:scale-110 cursor-pointer" alt="real" />
                                        )) : <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center"><Camera size={20} className="text-gray-300" /></div>}
                                    </div>

                                    {w.video_url && (
                                        <a href={w.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                                            <PlayCircle size={28} className="fill-blue-50" />
                                            <span className="text-[10px] font-black uppercase">Ver Vídeo</span>
                                        </a>
                                    )}
                                </div>

                                {/* 4. Ações */}
                                <div className="flex md:flex-col gap-3 w-full md:w-auto">
                                    {showTrash ? (
                                        <button onClick={() => handleRestore(w.id)} className="flex-1 md:flex-none p-5 bg-green-600 text-white rounded-3xl transition-all shadow-lg font-black text-xs uppercase hover:bg-green-700">Restaurar</button>
                                    ) : (
                                        <>
                                            <button onClick={() => { setSelectedWheel(w); setIsModalOpen(true); }} className="flex-1 md:flex-none p-5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-3xl transition-all shadow-sm active:scale-95"><Edit3 size={24} /></button>
                                            <button onClick={() => handleSoftDelete(w.id)} className="flex-1 md:flex-none p-5 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-3xl transition-all shadow-sm active:scale-95"><Trash2 size={24} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* PAGINAÇÃO */}
            {totalPages > 1 && (
                <div className="mt-16 flex justify-center pb-20">
                    <div className="flex items-center gap-1.5 p-2 bg-gray-900 rounded-[2rem] shadow-2xl">
                        <button disabled={currentPage === 1} onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 text-white/30 hover:text-white disabled:opacity-5 transition-all"><ChevronsLeft size={20} /></button>
                        <button disabled={currentPage === 1} onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 text-white/30 hover:text-white disabled:opacity-5 transition-all"><ChevronLeft size={20} /></button>
                        <div className="px-8 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 font-black text-xs text-white uppercase tracking-widest">{currentPage} de {totalPages}</div>
                        <button disabled={currentPage >= totalPages} onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 text-white/30 hover:text-white disabled:opacity-5 transition-all"><ChevronRight size={20} /></button>
                        <button disabled={currentPage >= totalPages} onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 text-white/30 hover:text-white disabled:opacity-5 transition-all"><ChevronsRight size={20} /></button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AddWheelModal
                    wheelToEdit={selectedWheel}
                    onClose={() => { setIsModalOpen(false); setSelectedWheel(null); }}
                    onSaved={() => { loadWheels(); loadFilterOptions(); setIsModalOpen(false); }}
                />
            )}
        </div>
    );
};

export default AdminPage;