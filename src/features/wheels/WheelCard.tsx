import React from 'react';
import { Play, Camera } from 'lucide-react';
import { WheelGroup } from '../../types/wheel';
import { resolveFinishImage } from '../../utils/finishResolver';

interface WheelCardProps {
  group: WheelGroup;
  onClick: () => void;
}

const optimizeThumb = (url: string, width: number = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

const WheelCard: React.FC<WheelCardProps> = ({ group, onClick }) => {
  const displayTags = group.defectTags.slice(0, 3);
  const extraTagsCount = group.defectTags.length - 3;

  const folder = group.model.toLowerCase().trim().replace(/\s+/g, '');
  const finishFileName = resolveFinishImage(group.finish);

  const catalogUrl = finishFileName
    ? `/modelos/${folder}/${finishFileName}`
    : `/modelos/${folder}/CAPA.jpg`;

  const realPhotoFallback = group.wheels[0]?.photos?.[0] 
    ? optimizeThumb(group.wheels[0].photos[0], 400) 
    : null;

  const emptyPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eeeeee'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23999999' text-anchor='middle' dy='.3em'%3ESem Foto%3C/text%3E%3C/svg%3E";

  const hasVideo = group.wheels.some(w => w.video_url);
  const realPhotosCount = group.wheels[0]?.photos?.length || 0;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-black/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* AREA DA IMAGEM - VOLTOU AO ORIGINAL */}
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        <img
          src={catalogUrl}
          alt={group.model}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (realPhotoFallback && target.src !== realPhotoFallback) {
              target.src = realPhotoFallback;
              const badge = target.parentElement?.querySelector('.badge-catalogo');
              if (badge) (badge as HTMLElement).style.display = 'none';
            } else {
              target.src = emptyPlaceholder;
            }
          }}
        />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasVideo && (
            <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
              <Play size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Vídeo Real</span>
            </div>
          )}
          {realPhotosCount > 0 && (
            <div className="bg-white/90 backdrop-blur-sm text-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-gray-100">
              <Camera size={12} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{realPhotosCount} Fotos</span>
            </div>
          )}
        </div>

        <div className="badge-catalogo absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] px-2.5 py-1.5 rounded-lg font-black text-gray-500 uppercase tracking-tighter shadow-sm border border-gray-100">
          Foto de Catálogo
        </div>

        {group.quantity > 1 && (
          <div className="absolute top-3 right-3 bg-black text-white text-[12px] px-3 py-2 rounded-xl font-black shadow-lg">
            {group.quantity} UNIDADES
          </div>
        )}
      </div>

      {/* INFO DO CARD - VOLTOU AO ORIGINAL */}
      <div className="p-6 flex flex-col flex-grow">
        <span className="text-[11px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">
          {group.brand}
        </span>

        <h3 className="font-black text-gray-900 text-xl mb-1 uppercase tracking-tighter leading-tight">
          {group.model}
        </h3>

        <p className="text-[13px] font-black text-blue-600 uppercase mb-2 tracking-tight">
          {group.finish}
        </p>

        <p className="text-sm text-gray-600 mb-5 font-bold italic">
          Aro {group.size} • {group.boltPattern}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {displayTags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-red-50 text-red-600 text-[11px] font-black uppercase rounded-lg border border-red-100"
            >
              {tag}
            </span>
          ))}

          {extraTagsCount > 0 && (
            <span className="px-3 py-1.5 bg-gray-50 text-gray-400 text-[11px] font-black rounded-lg border border-gray-100">
              +{extraTagsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WheelCard;
