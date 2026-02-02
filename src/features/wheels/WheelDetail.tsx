import React, { useEffect, useMemo, useRef, useState } from "react";
import { WheelGroup, IndividualWheel } from "../../types/wheel";
import {
  ChevronLeft,
  Share2,
  CameraOff,
  Video,
} from "lucide-react";
import { resolveFinishImage } from "../../utils/finishResolver";

interface WheelDetailProps {
  group: WheelGroup;
  onBack: () => void;
}

const optimizeMedia = (url: string, width?: number) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
  }
  const params = `f_auto,q_auto${width ? `,w_${width}` : ''}`;
  return url.replace('/upload/', `/upload/${params}/`);
};

const WheelDetail: React.FC<WheelDetailProps> = ({ group, onBack }) => {
  const folder = group.model.toLowerCase().trim().replace(/\s+/g, "");
  const finishFileName = resolveFinishImage(group.finish);
  const catalogUrl = finishFileName
    ? `/modelos/${folder}/${finishFileName}`
    : `/modelos/${folder}/CAPA.jpg`;

  const handleShareImages = async (item: IndividualWheel, index: number) => {
    const currentUrl = window.location.href; // Link da página atual
    const message =
      `*RELATÓRIO TÉCNICO – START INTELIGENTE*\n\n` +
      `*Modelo:* ${group.model}\n` +
      `*Unidade:* #${index + 1}\n` +
      `*Aro:* ${group.size}\n` +
      `*Furação:* ${group.boltPattern}\n` +
      `*Acabamento:* ${group.finish}\n\n` +
      `*Link da Inspeção:* ${currentUrl}\n\n` +
      `*Mídias anexas:* Fotos e vídeos da inspeção abaixo:`;

    try {
      const filesArray: File[] = [];

      const urlToFile = async (url: string, fileName: string, mimeType: string) => {
        const optimizedUrl = optimizeMedia(url, 1200); 
        const response = await fetch(optimizedUrl);
        if (!response.ok) throw new Error("Falha ao baixar arquivo");
        const data = await response.blob();
        return new File([data], fileName, { type: mimeType });
      };

      if (item.photos && item.photos.length > 0) {
        const photoFiles = await Promise.all(
          item.photos.map((url, i) => urlToFile(url, `roda_foto_${i + 1}.jpg`, "image/jpeg"))
        );
        filesArray.push(...photoFiles);
      }

      if (item.video_url) {
        const videoFile = await urlToFile(item.video_url, `inspecao.mp4`, "video/mp4");
        filesArray.push(videoFile);
      }

      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          files: filesArray,
          title: `Relatório - ${group.model}`,
          text: message,
        });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      }
    } catch (err) {
      console.error("Erro no compartilhamento:", err);
    }
  };

  return (
    <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 bg-white">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-black uppercase text-gray-400 hover:text-black mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-4 border-gray-50 pb-12">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 shadow-sm bg-gray-50 mt-1">
            <img
              src={catalogUrl}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = optimizeMedia(group.wheels[0]?.photos?.[0] || "", 400);
              }}
              alt={group.model}
            />
          </div>
          <div>
            <span className="text-[14px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-2">{group.brand}</span>
            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter mb-8 text-gray-900 uppercase leading-none">{group.model}</h1>
            <div className="flex flex-wrap items-center gap-10">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Aro</span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">{group.size}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Furação</span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">{group.boltPattern}</span>
              </div>
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
  const mediaList = useMemo(() => [
    ...photos.map((url) => ({ type: "image" as const, url })),
    ...(videoUrl ? [{ type: "video" as const, url: videoUrl }] : []),
  ], [photos, videoUrl]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start pb-20 border-b border-gray-50 last:border-0">
      <div className="space-y-6">
        <div className="aspect-square bg-white rounded-[3rem] overflow-hidden relative border-2 border-gray-100 shadow-sm flex items-center justify-center">
          {mediaList.length > 0 ? (
            mediaList[activeIndex].type === "video" ? (
              <video
                key={mediaList[activeIndex].url}
                src={optimizeMedia(mediaList[activeIndex].url)}
                controls autoPlay muted playsInline
                onLoadedData={() => setMediaLoading(false)}
                className={`w-full h-full object-cover ${mediaLoading ? "opacity-0" : "opacity-100"}`}
              />
            ) : (
              <img
                key={mediaList[activeIndex].url}
                src={optimizeMedia(mediaList[activeIndex].url, 1200)}
                onLoad={() => setMediaLoading(false)}
                className={`w-full h-full object-cover ${mediaLoading ? "opacity-0" : "opacity-100"}`}
                alt={`Unidade ${index + 1}`}
              />
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
              onClick={() => { setMediaLoading(true); setActiveIndex(i); }}
              className={`min-w-[110px] h-[110px] rounded-[1.5rem] overflow-hidden border-4 transition-all ${activeIndex === i ? "border-blue-600 scale-105" : "border-white opacity-40"}`}
            >
              {media.type === "video" ? (
                <div className="w-full h-full bg-blue-50 flex items-center justify-center"><Video className="text-blue-600" /></div>
              ) : (
                <img src={optimizeMedia(media.url, 200)} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col h-full justify-between pt-4">
        <div className="space-y-12">
          <h3 className="text-6xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">UNIDADE #{index + 1}</h3>
          <div>
            <label className="text-[12px] font-black text-blue-600 uppercase tracking-[0.25em] block mb-5">Avarias Detectadas</label>
            <div className="flex flex-wrap gap-3">
              {item.defects.map((d) => (
                <span key={d} className="px-6 py-3 bg-red-600 text-white text-[13px] font-black uppercase rounded-2xl shadow-xl">{d}</span>
              ))}
            </div>
          </div>
          <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border-2 border-gray-100">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-4">Relatório</label>
            <p className="text-gray-800 leading-relaxed text-2xl font-bold italic">"{item.description || "Inspecionada."}"</p>
          </div>
        </div>
        <button onClick={onShare} className="mt-16 w-full bg-[#25D366] text-white py-7 rounded-[2rem] font-black uppercase text-xl flex items-center justify-center gap-5 shadow-2xl transition-all hover:scale-[1.02]">
          <Share2 size={32} /> Compartilhar Relatório
        </button>
      </div>
    </div>
  );
};

export default WheelDetail;
