import React, { useState } from 'react';
import { WheelGroup, IndividualWheel } from '../../types/wheel';
import { ChevronLeft, Share2, CameraOff, Video, MessageCircle } from 'lucide-react';
import { resolveFinishImage } from '../../utils/finishResolver';

interface WheelDetailProps {
  group: WheelGroup;
  onBack: () => void;
}

const WheelDetail: React.FC<WheelDetailProps> = ({ group, onBack }) => {
  const folder = group.model.toLowerCase().trim().replace(/\s+/g, '');
  const finishFileName = resolveFinishImage(group.finish);
  const catalogUrl = finishFileName
    ? `/modelos/${folder}/${finishFileName}`
    : `/modelos/${folder}/CAPA.jpg`;

  /* ============================================================
      COMPARTILHAMENTO DE TODAS AS MÍDIAS (FOTOS + VÍDEO)
      ============================================================ */
  const handleShareImages = async (item: IndividualWheel, index: number) => {
    // Mensagem de cabeçalho para o WhatsApp
    const message = `*DETALHES*\n` +
      `*Roda:* ${group.model}\n` +
      `*Unidade:* #${index + 1}\n` +
      `*Aro:* ${group.size}`;

    try {
      const filesArray: File[] = [];

      // Função para converter URL em arquivo real
      const urlToFile = async (url: string, fileName: string, mimeType: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao baixar arquivo');
        const data = await response.blob();
        return new File([data], fileName, { type: mimeType });
      };

      // 1. Processar TODAS as fotos
      if (item.photos && item.photos.length > 0) {
        const photoPromises = item.photos.map((url, i) =>
          urlToFile(url, `roda_${index + 1}_foto_${i + 1}.jpg`, 'image/jpeg')
        );
        const photoFiles = await Promise.all(photoPromises);
        filesArray.push(...photoFiles);
      }

      // 2. Processar o Vídeo (se houver)
      if (item.video_url) {
        const videoFile = await urlToFile(item.video_url, `inspecao_${index + 1}.mp4`, 'video/mp4');
        filesArray.push(videoFile);
      }

      // 3. Compartilhar usando a API Nativa (Web Share API)
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          files: filesArray,
          title: `Relatório Técnico - ${group.model}`,
          text: message,
        });
      } else {
        // Fallback: Se o navegador não suportar arquivos, envia os links via WhatsApp
        const links = item.photos?.map((u, i) => `\nFoto ${i + 1}: ${u}`).join('') +
          (item.video_url ? `\n\nVídeo: ${item.video_url}` : '');

        window.open(`https://wa.me/?text=${encodeURIComponent(message + links)}`, '_blank');
      }
    } catch (err) {
      console.error('Erro no compartilhamento:', err);
      alert("Houve um erro ao processar as imagens. Verifique sua conexão e tente novamente.");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 bg-white">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-black uppercase text-gray-400 hover:text-black mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-4 border-gray-50 pb-12">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 shadow-sm bg-gray-50 mt-1">
            <img
              src={catalogUrl}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = group.wheels[0]?.photos?.[0] || "";
              }}
            />
          </div>

          <div>
            <span className="text-[14px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-2">
              {group.brand}
            </span>
            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter mb-8 text-gray-900 uppercase leading-none">
              {group.model}
            </h1>
            <div className="flex flex-wrap items-center gap-10">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Aro</span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">{group.size}</span>
              </div>
              <div className="w-px h-12 bg-gray-100 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Furação</span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">{group.boltPattern}</span>
              </div>
              <div className="w-px h-12 bg-gray-100 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Acabamento</span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">{group.finish}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-32">
        {group.wheels.map((item, index) => (
          <IndividualWheelCard
            key={item.id}
            item={item}
            index={index}
            onShare={() => handleShareImages(item, index)}
          />
        ))}
      </div>
    </div>
  );
};

const IndividualWheelCard: React.FC<{
  item: IndividualWheel;
  index: number;
  onShare: () => void;
}> = ({ item, index, onShare }) => {

  const photos = item.photos || [];
  const videoUrl = item.video_url;
  const mediaList = [
    ...photos.map(url => ({ type: 'image', url })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl }] : [])
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start pb-20 border-b border-gray-50 last:border-0">
      <div className="space-y-6">
        <div className="aspect-square bg-white rounded-[3rem] overflow-hidden relative border-2 border-gray-100 shadow-sm flex items-center justify-center">
          {mediaList.length > 0 ? (
            mediaList[activeIndex].type === 'video' ? (
              <video key={mediaList[activeIndex].url} src={mediaList[activeIndex].url} controls autoPlay muted playsInline className="w-full h-full object-cover bg-white" />
            ) : (
              <img src={mediaList[activeIndex].url} className="w-full h-full object-cover animate-in fade-in duration-300" />
            )
          ) : (
            <div className="flex flex-col items-center text-gray-200 gap-4">
              <CameraOff size={60} />
              <span className="text-xs font-black uppercase tracking-widest">Sem mídia</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {mediaList.map((media, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`min-w-[110px] h-[110px] rounded-[1.5rem] overflow-hidden border-4 transition-all relative ${activeIndex === i ? 'border-blue-600 scale-105 shadow-md' : 'border-white opacity-40'}`}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center">
                  <Video className="text-blue-600 mb-1" size={28} />
                  <span className="text-[10px] font-black text-blue-600 uppercase">Vídeo</span>
                </div>
              ) : (
                <img src={media.url} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col h-full justify-between pt-4">
        <div className="space-y-12">
          <h3 className="text-6xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">UNIDADE #{index + 1}</h3>

          <div>
            <label className="text-[12px] font-black text-blue-600 uppercase tracking-[0.25em] block mb-5">Inspeção de Avarias</label>
            <div className="flex flex-wrap gap-3">
              {item.defects.map((d) => (
                <span key={d} className="px-6 py-3 bg-red-600 text-white text-[13px] font-black uppercase rounded-2xl shadow-xl">{d}</span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border-2 border-gray-100 shadow-inner">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-4">Relatório do Especialista</label>
            <p className="text-gray-800 leading-relaxed text-2xl font-bold italic">"{item.description || "Unidade inspecionada."}"</p>
          </div>
        </div>

        {/* BOTÃO COM WEB SHARE API */}
        <button
          onClick={onShare}
          className="mt-16 w-full bg-[#25D366] hover:bg-[#1fae53] text-white py-7 rounded-[2rem] font-black uppercase text-xl flex items-center justify-center gap-5 shadow-2xl transition-all active:scale-95"
        >
          <Share2 size={32} />
          Compartilhar Imagens
        </button>
      </div>
    </div>
  );
};

export default WheelDetail;