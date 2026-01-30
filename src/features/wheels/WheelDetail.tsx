import React, { useEffect, useMemo, useRef, useState } from "react";
import { WheelGroup, IndividualWheel } from "../../types/wheel";
import {
  ChevronLeft,
  Share2,
  CameraOff,
  Video,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { resolveFinishImage } from "../../utils/finishResolver";

interface WheelDetailProps {
  group: WheelGroup;
  onBack: () => void;
}

const ITEMS_SCROLL_SHOW_FLOATING_BACK = 140;

// FUNÇÃO DE OURO: Otimiza fotos e vídeos do Cloudinary
const optimizeMedia = (url: string, width?: number) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  
  // Para Vídeos: f_auto escolhe o melhor formato, q_auto comprime o peso
  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
  }
  
  // Para Fotos: f_auto/q_auto reduzem o peso, width limita a resolução
  const params = `f_auto,q_auto${width ? `,w_${width}` : ''}`;
  return url.replace('/upload/', `/upload/${params}/`);
};

const WheelDetail: React.FC<WheelDetailProps> = ({ group, onBack }) => {
  const folder = group.model.toLowerCase().trim().replace(/\s+/g, "");
  const finishFileName = resolveFinishImage(group.finish);
  const catalogUrl = finishFileName
    ? `/modelos/${folder}/${finishFileName}`
    : `/modelos/${folder}/CAPA.jpg`;

  const [showFloatingBack, setShowFloatingBack] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(16);

  useEffect(() => {
    const computeHeaderOffset = () => {
      const headerEl =
        (document.querySelector("header") as HTMLElement | null) ||
        (document.querySelector("#app-header") as HTMLElement | null) ||
        (document.querySelector(".site-header") as HTMLElement | null);

      const h = headerEl?.getBoundingClientRect().height ?? 0;
      setHeaderOffset(Math.max(16, h + 12));
    };

    const onScroll = () => {
      computeHeaderOffset();
      setShowFloatingBack(window.scrollY > ITEMS_SCROLL_SHOW_FLOATING_BACK);
    };

    computeHeaderOffset();
    onScroll();

    window.addEventListener("resize", computeHeaderOffset);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", computeHeaderOffset);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleShareImages = async (item: IndividualWheel, index: number) => {
    const message =
      `*RELATÓRIO TÉCNICO – RODAS*\n\n` +
      `*Modelo:* ${group.model}\n` +
      (group.brand ? `*Marca:* ${group.brand}\n` : "") +
      `*Unidade:* #${index + 1}\n` +
      `*Aro:* ${group.size}\n` +
      `*Furação:* ${group.boltPattern}\n` +
      (item.wheel_offset ? `*ET:* ${item.wheel_offset}\n` : "") +
      `*Acabamento:* ${group.finish}\n\n` +
      `*Mídias anexas:*\n` +
      `– Fotos da inspeção\n` +
      (item.video_url ? `– Vídeo da inspeção\n` : "");

    try {
      const filesArray: File[] = [];

      const urlToFile = async (url: string, fileName: string, mimeType: string) => {
        // Baixa a versão já otimizada para o compartilhamento ser rápido
        const optimizedUrl = optimizeMedia(url, 1200); 
        const response = await fetch(optimizedUrl);
        if (!response.ok) throw new Error("Falha ao baixar arquivo");
        const data = await response.blob();
        return new File([data], fileName, { type: mimeType });
      };

      if (item.photos && item.photos.length > 0) {
        const photoPromises = item.photos.map((url, i) =>
          urlToFile(url, `roda_${index + 1}_foto_${i + 1}.jpg`, "image/jpeg")
        );
        const photoFiles = await Promise.all(photoPromises);
        filesArray.push(...photoFiles);
      }

      if (item.video_url) {
        const videoFile = await urlToFile(
          item.video_url,
          `inspecao_${index + 1}.mp4`,
          "video/mp4"
        );
        filesArray.push(videoFile);
      }

      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          files: filesArray,
          title: `Relatório Técnico - ${group.model}`,
          text: message,
        });
      } else {
        const links =
          (item.photos?.map((u, i) => `\nFoto ${i + 1}: ${optimizeMedia(u, 1200)}`).join("") || "") +
          (item.video_url ? `\n\nVídeo: ${optimizeMedia(item.video_url)}` : "");

        window.open(
          `https://wa.me/?text=${encodeURIComponent(message + links)}`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("Erro no compartilhamento:", err);
      alert("Houve um erro ao processar as mídias.");
    }
  };

  return (
    <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 bg-white">
      {/* HEADER E LISTA PERMANECEM IGUAIS, APENAS OTIMIZADOS NO CARD ABAIXO */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-black uppercase text-gray-400 hover:text-black mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </button>

      {/* HEADER INFO */}
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

  const mediaList = useMemo(
    () => [
      ...photos.map((url) => ({ type: "image" as const, url })),
      ...(videoUrl ? [{ type: "video" as const, url: videoUrl }] : []),
    ],
    [photos, videoUrl]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start pb-20 border-b border-gray-50 last:border-0">
      <div className="space-y-6">
        <div className="aspect-square bg-white rounded-[3rem] overflow-hidden relative border-2 border-gray-100 shadow-sm flex items-center justify-center">
          {mediaList.length > 0 ? (
            mediaList[activeIndex].type === "video" ? (
              <video
                ref={videoRef}
                key={mediaList[activeIndex].url}
                src={optimizeMedia(mediaList[activeIndex].url)} // OTIMIZADO
                controls autoPlay muted playsInline
                onLoadedData={() => setMediaLoading(false)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${mediaLoading ? "opacity-0" : "opacity-100"}`}
              />
            ) : (
              <img
                key={mediaList[activeIndex].url}
                src={optimizeMedia(mediaList[activeIndex].url, 1200)} // OTIMIZADO
                onLoad={() => setMediaLoading(false)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${mediaLoading ? "opacity-0" : "opacity-100"}`}
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

        {/* THUMBS OTIMIZADOS */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {mediaList.map((media, i) => (
            <button
              key={i}
              onClick={() => { setMediaLoading(true); setActiveIndex(i); }}
              className={`min-w-[110px] h-[110px] rounded-[1.5rem] overflow-hidden border-4 transition-all ${activeIndex === i ? "border-blue-600 scale-105" : "border-white opacity-40"}`}
            >
              {media.type === "video" ? (
                <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center">
                  <Video className="text-blue-600" size={28} />
                </div>
              ) : (
                <img src={optimizeMedia(media.url, 300)} className="w-full h-full object-cover" alt="" />
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
        <button onClick={onShare} className="mt-16 w-full bg-[#25D366] hover:bg-[#1fae53] text-white py-7 rounded-[2rem] font-black uppercase text-xl flex items-center justify-center gap-5 shadow-2xl transition-all">
          <Share2 size={32} /> Compartilhar Imagens
        </button>
      </div>
    </div>
  );
};

export default WheelDetail;
