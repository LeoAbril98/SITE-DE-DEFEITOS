import React from 'react';
import { ChevronLeft, Play, Camera } from 'lucide-react';
import { WheelGroup } from '../../types/wheel';

interface WheelDetailProps {
  group: WheelGroup;
  onBack: () => void;
}

const WheelDetail: React.FC<WheelDetailProps> = ({ group, onBack }) => {
  
  // FUNÇÃO DE OURO: Otimiza fotos e vídeos sem perder qualidade visível
  const optimizeMedia = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    // Para Vídeos: f_auto escolhe o melhor formato (ex: mp4/webm), q_auto comprime o peso
    if (url.includes('/video/upload/')) {
      return url.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
    }
    
    // Para Fotos: w_1200 garante nitidez em telas grandes, f_auto/q_auto reduzem o peso em até 90%
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
  };

  const mainPhoto = group.wheels[0]?.photos?.[0];
  const videoUrl = group.wheels.find(w => w.video_url)?.video_url;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 font-bold uppercase text-xs tracking-widest transition-colors"
      >
        <ChevronLeft size={16} /> Voltar ao Catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* SEÇÃO DE MÍDIA */}
        <div className="space-y-6">
          {videoUrl ? (
            <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
              <video 
                src={optimizeMedia(videoUrl)} 
                controls 
                className="w-full h-full object-contain"
                poster={mainPhoto ? optimizeMedia(mainPhoto) : undefined}
              />
            </div>
          ) : (
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-xl">
              <img 
                src={mainPhoto ? optimizeMedia(mainPhoto) : '/placeholder.jpg'} 
                alt={group.model}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* MINIATURAS DAS OUTRAS RODAS DO GRUPO */}
          <div className="grid grid-cols-4 gap-4">
            {group.wheels[0]?.photos?.slice(1).map((photo, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img 
                  src={optimizeMedia(photo)} 
                  className="w-full h-full object-cover" 
                  alt={`Detalhe ${idx}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* SEÇÃO DE INFORMAÇÕES */}
        <div className="flex flex-col">
          <span className="text-sm text-blue-600 font-black uppercase tracking-[0.2em] mb-2">
            {group.brand}
          </span>
          <h1 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter mb-4 leading-none">
            {group.model}
          </h1>
          <p className="text-xl font-bold text-gray-500 uppercase mb-8 tracking-tight">
            {group.finish}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aro / Diâmetro</p>
              <p className="text-2xl font-black text-gray-900">Aro {group.size}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Furação</p>
              <p className="text-2xl font-black text-gray-900">{group.boltPattern}</p>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Estado e Defeitos</h4>
            <div className="flex flex-wrap gap-2">
              {group.defectTags.map((tag, idx) => (
                <span key={idx} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-black uppercase rounded-xl border border-red-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto p-8 bg-black rounded-3xl text-white flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disponível em Estoque</p>
              <p className="text-3xl font-black">{group.quantity} UNIDADES</p>
            </div>
            <button className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-sm hover:scale-105 transition-transform">
              Tenho Interesse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelDetail;
