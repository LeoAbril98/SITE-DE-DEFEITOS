import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Search, Video, Camera } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { IndividualWheel } from '../../../types/wheel';
import { useWheelCsv } from './useWheelCsv';
import { DefectTags } from './DefectTags';

interface AddWheelModalProps {
    onClose: () => void;
    onSaved: () => void;
    wheelToEdit?: IndividualWheel | null;
}

const AddWheelModal: React.FC<AddWheelModalProps> = ({ onClose, onSaved, wheelToEdit }) => {
    const [form, setForm] = useState({
        model: '',
        brand: '',
        size: '',
        boltPattern: '',
        finish: '',
        offset: '',
        description: '',
        defects: [] as string[],
    });

    const [saving, setSaving] = useState(false);
    const [photos, setPhotos] = useState<(File | string | null)[]>([null, null, null]);
    const [video, setVideo] = useState<File | string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const { wheels, models } = useWheelCsv();

    // --- AUXILIAR: COMPRESSÃO DE IMAGEM (Reduz 5MB para ~200KB) ---
    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200; 
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Falha na compressão'));
                    }, 'image/jpeg', 0.8);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // --- AUXILIAR: UPLOAD CLOUDINARY ---
    const uploadToCloudinary = async (file: File | Blob, resourceType: 'image' | 'video') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'vqsa6bwd'); 
        formData.append('folder', 'wheels_app');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/deu98m3rp/${resourceType}/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error(`Falha no upload de ${resourceType}`);
        const data = await response.json();
        return data.secure_url;
    };

    // --- LÓGICA DE SALVAMENTO ---
    async function handleSave() {
        if (!form.model || !form.size || saving) return;
        setSaving(true);

        try {
            const photoUrls: string[] = [];
            for (const item of photos) {
                if (item instanceof File) {
                    const compressed = await compressImage(item);
                    const url = await uploadToCloudinary(compressed, 'image');
                    photoUrls.push(url);
                } else if (typeof item === 'string') {
                    photoUrls.push(item);
                }
            }

            let finalVideoUrl = typeof video === 'string' ? video : null;
            if (video instanceof File) {
                finalVideoUrl = await uploadToCloudinary(video, 'video');
            }

            const wheelData = {
                model: form.model,
                brand: form.brand,
                size: form.size,
                bolt_pattern: form.boltPattern,
                finish: form.finish,
                wheel_offset: Number(form.offset),
                description: form.description,
                defects: form.defects,
                photos: photoUrls,
                video_url: finalVideoUrl
            };

            if (wheelToEdit) {
                await supabase.from('individual_wheels').update(wheelData).eq('id', wheelToEdit.id);
            } else {
                await supabase.from('individual_wheels').insert([wheelData]);
            }

            onSaved();
            onClose();
        } catch (err: any) {
            alert("Erro ao salvar: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    // Handlers para Mídia
    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const maxSize = 25 * 1024 * 1024; // Limite de 25MB para segurança

            if (file.size > maxSize) {
                alert("Vídeo muito grande! Grave em 720p ou diminua o tempo para economizar dados.");
                e.target.value = "";
                return;
            }

            setVideo(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    // Efeito para carregar dados em edição
    useEffect(() => {
        if (wheelToEdit) {
            setForm({
                model: wheelToEdit.model,
                brand: wheelToEdit.brand || '',
                size: wheelToEdit.size,
                boltPattern: wheelToEdit.bolt_pattern,
                finish: wheelToEdit.finish,
                offset: wheelToEdit.wheel_offset?.toString() || '',
                description: wheelToEdit.description || '',
                defects: wheelToEdit.defects || [],
            });
            setSearchTerm(wheelToEdit.model);
            const p = wheelToEdit.photos || [];
            setPhotos([p[0] || null, p[1] || null, p[2] || null]);
            if (wheelToEdit.video_url) setVideoPreview(wheelToEdit.video_url);
        }
    }, [wheelToEdit]);

    // Filtragem dinâmica via CSV
    const filteredModels = models.filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
    const arosByModel = [...new Set(wheels.filter(w => w.modelo === form.model).map(w => w.aro))];
    const furacoesByAro = [...new Set(wheels.filter(w => w.modelo === form.model && w.aro === form.size).map(w => w.furacao))];
    const acabamentosByCombo = [...new Set(wheels.filter(w => w.modelo === form.model && w.aro === form.size && w.furacao === form.boltPattern).map(w => w.acabamento))];
    const offsetsByCombo = [...new Set(wheels.filter(w => w.modelo === form.model && w.aro === form.size && w.furacao === form.boltPattern && w.acabamento === form.finish).map(w => w.offset))].filter(Boolean).sort((a, b) => Number(a) - Number(b));

    const fieldClass = 'w-full border-2 rounded-xl p-3 text-base bg-white focus:border-black outline-none transition-all disabled:bg-gray-50';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh]">
                
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-black uppercase italic">{wheelToEdit ? 'Editar Roda' : 'Nova Roda'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto custom-scroll">
                    {/* SELEÇÃO DE FOTOS E VÍDEO */}
                    <div className="grid grid-cols-4 gap-3">
                        {photos.map((photo, i) => (
                            <label key={i} className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative">
                                {photo ? <img src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const updated = [...photos];
                                        updated[i] = e.target.files[0];
                                        setPhotos(updated);
                                    }
                                }} />
                            </label>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                            {videoPreview ? <video src={videoPreview} className="w-full h-full object-cover" /> : <Video className="text-blue-400" />}
                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                        </label>
                    </div>

                    <div className="space-y-4">
                        {/* BUSCA DE MODELO */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                            <input
                                type="text" placeholder="Modelo..." className={`${fieldClass} pl-10`}
                                value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                            />
                            {showSuggestions && filteredModels.length > 0 && (
                                <div ref={suggestionRef} className="absolute left-0 right-0 mt-1 bg-white border-2 border-black rounded-xl shadow-2xl max-h-56 overflow-y-auto z-[80]">
                                    {filteredModels.map(m => (
                                        <button key={m} className="w-full text-left px-4 py-4 hover:bg-gray-100 border-b text-sm font-bold uppercase"
                                            onClick={() => {
                                                setForm({ ...form, model: m, size: '', boltPattern: '', finish: '', offset: '' });
                                                setSearchTerm(m); setShowSuggestions(false);
                                            }}>{m}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SELECTS DINÂMICOS */}
                        <div className="grid grid-cols-2 gap-4">
                            <select value={form.size} disabled={!form.model} onChange={e => setForm({ ...form, size: e.target.value })} className={fieldClass}>
                                <option value="">Aro</option>
                                {arosByModel.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select value={form.boltPattern} disabled={!form.size} onChange={e => setForm({ ...form, boltPattern: e.target.value })} className={fieldClass}>
                                <option value="">Furação</option>
                                {furacoesByAro.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <select value={form.finish} disabled={!form.boltPattern} onChange={e => setForm({ ...form, finish: e.target.value })} className={fieldClass}>
                                <option value="">Acabamento</option>
                                {acabamentosByCombo.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select value={form.offset} disabled={!form.finish} onChange={e => setForm({ ...form, offset: e.target.value })} className={fieldClass}>
                                <option value="">Offset (ET)</option>
                                {offsetsByCombo.map(o => <option key={o} value={o}>{o}mm</option>)}
                            </select>
                        </div>

                        <textarea
                            placeholder="Descrição adicional..." className={`${fieldClass} min-h-[80px]`}
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <DefectTags selected={form.defects} onToggle={(d) => setForm(f => ({ ...f, defects: f.defects.includes(d) ? f.defects.filter(x => x !== d) : [...f.defects, d] }))} />
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="bg-black text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:bg-gray-300">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddWheelModal;
