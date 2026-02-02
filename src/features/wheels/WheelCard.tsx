import React from 'react';
import { Play, Camera } from 'lucide-react';
import { WheelGroup } from '../../types/wheel';
import { resolveFinishImage } from '../../utils/finishResolver';

interface WheelCardProps {
  group: WheelGroup;
  // Alterado para passar o ID no clique, ajudando o Router a não se perder
  onClick: (id: string) => void;
}

const optimizeThumb = (url: string, width: number = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

const WheelCard: React.FC<WheelCardProps> = ({ group, onClick }) => {
  const displayTags = group.defectTags.slice(0, 2); // Reduzido para 2 tags no card para não poluir
  const extraTagsCount = group.defectTags.length - 2;

  const folder = group.model.toLowerCase().trim().replace(/\s+/g, '');
  const finishFileName = resolveFinishImage(group.finish);

  const catalogUrl = finishFileName
    ? `/modelos/${folder}/${finishFileName}`
    : `/modelos/${folder}/CAPA.jpg`;

  const realPhotoFallback = group.wheels[0]?.photos?.[0] 
    ? optimizeThumb(group.wheels[0].photos[0], 400) 
    : null;

  const emptyPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f9fafb'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' font-weight='900' fill='%23d1d5db' text-anchor='middle' uppercase%3ESem Imagem%3C/text%3E%3C/svg%3E";

  const hasVideo = group.wheels.some(w => w.video_url);
  const realPhotosCount = group.wheels[0]?.photos?.length || 0;

  return (
    <div
      // Passamos o ID real da primeira roda para o clique
      onClick={() => onClick(group.wheels[0].id)}
      className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500 cursor-pointer flex flex-col h-full relative"
    >
      {/* BADGE DE QUANTIDADE - MAIS DISCRETO E MODERNO */}
      {group.quantity > 1 && (
        <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-black shadow-lg border border-white/10">
          {group.quantity} UNIDADES
        </div>
      )}

      {/* ÁREA DA IMAGEM */}
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

        {/* INDICADORES DE MÍDIA - AGRUPADOS EM BAIXO */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {hasVideo && (
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg">
              <Play size={14} fill="currentColor" />
            </div>
          )}
          {realPhotosCount > 0 && (
            <div className="bg-white/90 backdrop-blur-sm text-black p-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-1.5">
              <Camera size={14} />
              <span className="text-[10px] font-black">{realPhotosCount}</span>
            </div>
          )}
        </div>

        {/* SELO DE CATÁLOGO MAIS DISCRETO */}
        <div className="badge-catalogo absolute bottom-3 left-3 bg-white/60 backdrop-blur-xs text-[8px] px-2 py-1 rounded-md font-black text-gray-400 uppercase tracking-tighter border border-gray-100/50">
          Catálogo
        </div>
      </div>

      {/* INFO DO CARD */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-3">
          <span className="text-[10px] text-blue-500 uppercase tracking-[0.2em] font-black block mb-1">
            {group.brand || 'KR Wheels'}
          </span>
          <h3 className="font-black text-gray-900 text-2xl uppercase tracking-tighter leading-none mb-1">
            {group.model}
          </h3>
          <p className="text-[11px] font-bold text-gray-400 uppercase truncate">
            {group.finish}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="bg-gray-100 text-gray-700 text-[11px] font-black px-2 py-1 rounded-md uppercase italic">
             Aro {group.size}
          </span>
          <span className="bg-gray-100 text-gray-700 text-[11px] font-black px-2 py-1 rounded-md uppercase">
             {group.boltPattern}
          </span>
        </div>

        {/* TAGS DE DEFEITOS - ESTILO CLEAN */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {displayTags.map((tag, index) => (
            <span
              key={index}
              className="px-2.5 py-1.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-lg border border-red-100 flex-shrink-0"
            >
              {tag}
            </span>
          ))}
          {extraTagsCount > 0 && (
            <span className="px-2.5 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black rounded-lg">
              +{extraTagsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WheelCard;
