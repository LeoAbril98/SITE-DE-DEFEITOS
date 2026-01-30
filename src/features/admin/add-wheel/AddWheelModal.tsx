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
        model: '', brand: '', size: '', boltPattern: '', finish: '', offset: '', description: '', defects: [] as string[],
    });

    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); 
    const [photos, setPhotos] = useState<(File | string | null)[]>([null, null, null]);
    const [video, setVideo] = useState<File | string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const { wheels, models } = useWheelCsv();

    // --- COMPRESSÃO DE IMAGEM: Reduz arquivos de ~5MB para ~200KB ---
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
                    const scale = Math.min(MAX_WIDTH / img.width, 1);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                    canvas.toBlob((blob) => blob ? resolve(blob) : reject(), 'image/jpeg', 0.8);
                };
            };
            reader.onerror = reject;
        });
    };

    // --- UPLOAD COM MONITORAMENTO DE PROGRESSO (XHR) ---
    const uploadToCloudinary = (file: File | Blob, resourceType: 'image' | 'video'): Promise<string> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'vqsa6bwd');
            formData.append('folder', 'wheels_app');

            xhr.open('POST', `https://api.cloudinary.com/v1_1/deu98m3rp/${resourceType}/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
                else reject(new Error('Falha no upload'));
            };

            xhr.onerror = () => reject(new Error('Erro de conexão'));
            xhr.send(formData);
        });
    };

    async function handleSave() {
        if (!form.model || !form.size || saving) return;
        setSaving(true);
        setUploadProgress(0);

        try {
            const photoUrls: string[] = [];
            for (const item of photos) {
                if (item instanceof File) {
                    const compressed = await compressImage(item);
                    photoUrls.push(await uploadToCloudinary(compressed, 'image'));
                } else if (typeof item === 'string') photoUrls.push(item);
            }

            let finalVideoUrl = typeof video === 'string' ? video : null;
            if (video instanceof File) {
                finalVideoUrl = await uploadToCloudinary(video, 'video');
            }

            const wheelData = {
                model: form.model, brand: form.brand, size: form.size, bolt_pattern: form.boltPattern,
                finish: form.finish, wheel_offset: Number(form.offset), description: form.description,
                defects: form.defects, photos: photoUrls, video_url: finalVideoUrl
            };

            if (wheelToEdit) await supabase.from('individual_wheels').update(wheelData).eq('id', wheelToEdit.id);
            else await supabase.from('individual_wheels').insert([wheelData]);

            onSaved();
            onClose();
        } catch (err: any) {
            alert("Erro: " + err.message);
        } finally {
            setSaving(false);
            setUploadProgress(0);
        }
    }

    // Handlers e Effects para busca e edição
    useEffect(() => {
        if (wheelToEdit) {
            setForm({
                model: wheelToEdit.model, brand: wheelToEdit.brand || '', size: wheelToEdit.size,
                boltPattern: wheelToEdit.bolt_pattern, finish: wheelToEdit.finish,
                offset: wheelToEdit.wheel_offset?.toString() || '',
                description: wheelToEdit.description || '', defects: wheelToEdit.defects || [],
            });
            setSearchTerm(wheelToEdit.model);
            const p = wheelToEdit.photos || [];
            setPhotos([p[0] || null, p[1] || null, p[2] || null]);
            if (wheelToEdit.video_url) setVideoPreview(wheelToEdit.video_url);
        }
    }, [wheelToEdit]);

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
                    {/* SELEÇÃO DE MÍDIA */}
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
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    if (e.target.files[0].size > 25 * 1024 * 1024) return alert("Vídeo muito grande (máx 25MB)");
                                    setVideo(e.target.files[0]);
                                    setVideoPreview(URL.createObjectURL(e.target.files[0]));
                                }
                            }} />
                        </label>
                    </div>

                    {/* CAMPOS TÉCNICOS */}
                    <div className="space-y-4">
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

                {/* RODAPÉ COM BARRA DE PROGRESSO */}
                <div className="p-6 border-t bg-gray-50 rounded-b-3xl">
                    {saving && (
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1 text-blue-600">
                                <span>Enviando arquivos...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_8px_rgba(37,99,235,0.5)]" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                        <button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="bg-black text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:bg-gray-300 min-w-[140px] justify-center"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddWheelModal;
