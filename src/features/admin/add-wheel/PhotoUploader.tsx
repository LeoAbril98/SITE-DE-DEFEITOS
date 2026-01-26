import { Camera, X } from "lucide-react"; // Opcional: instale lucide-react

interface Props {
    photos: File[];
    setPhotos: (files: File[]) => void;
    previews: string[];
    setPreviews: (urls: string[]) => void;
}

export function PhotoUploader({
    photos,
    setPhotos,
    previews,
    setPreviews,
}: Props) {
    function handleSelect(files: FileList | null) {
        if (!files) return;

        const selected = Array.from(files).slice(0, 3);
        setPhotos(selected);

        // Limpa as URLs antigas para evitar memory leak
        previews.forEach(url => URL.revokeObjectURL(url));
        setPreviews(selected.map(f => URL.createObjectURL(f)));
    }

    function removePhoto(index: number) {
        const newPhotos = photos.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        setPreviews(newPreviews);
    }

    return (
        <div className="w-full max-w-md">
            <label className="text-sm font-semibold text-gray-700 block mb-3">
                Fotos da roda <span className="text-gray-400 font-normal">(máximo 3)</span>
            </label>

            {/* Área de Upload Estilizada */}
            <div className="relative">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold">Clique para enviar</span> ou arraste
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden" // Esconde o input feio
                        accept="image/*"
                        multiple
                        onChange={e => handleSelect(e.target.files)}
                    />
                </label>
            </div>

            {/* Lista de Previews com botão de remover */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {previews.map((src, i) => (
                        <div key={i} className="relative group">
                            <img
                                src={src}
                                alt={`Preview ${i}`}
                                className="w-full h-24 object-cover rounded-lg border shadow-sm"
                            />
                            <button
                                onClick={() => removePhoto(i)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}