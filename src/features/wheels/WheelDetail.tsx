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

  /* ============================================================
      COMPARTILHAMENTO DE TODAS AS MÍDIAS (FOTOS + VÍDEO)
     ============================================================ */
  const handleShareImages = async (item: IndividualWheel, index: number) => {
    const message =
      `*DETALHES*\n` +
      `*Roda:* ${group.model}\n` +
      `*Unidade:* #${index + 1}\n` +
      `*Aro:* ${group.size}`;

    try {
      const filesArray: File[] = [];

      const urlToFile = async (url: string, fileName: string, mimeType: string) => {
        const response = await fetch(url);
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
          (item.photos?.map((u, i) => `\nFoto ${i + 1}: ${u}`).join("") || "") +
          (item.video_url ? `\n\nVídeo: ${item.video_url}` : "");

        window.open(
          `https://wa.me/?text=${encodeURIComponent(message + links)}`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("Erro no compartilhamento:", err);
      alert(
        "Houve um erro ao processar as mídias. Verifique sua conexão e tente novamente."
      );
    }
  };

  return (
    <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 bg-white">
      {/* BOTÃO NORMAL (TOPO) */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-black uppercase text-gray-400 hover:text-black mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </button>

      {/* BOTÃO FLUTUANTE (RESPEITA HEADER) */}
      {showFloatingBack && (
        <div className="fixed left-4 sm:left-6 z-50" style={{ top: headerOffset }}>
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-xl hover:bg-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
              Voltar
            </span>
          </button>
        </div>
      )}

      {/* SUBIR */}
      {showFloatingBack && (
        <div className="fixed right-4 sm:right-6 bottom-6 z-50">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="p-3 rounded-2xl bg-black text-white shadow-2xl hover:opacity-90 transition-all active:scale-95"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      )}

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
              alt={`${group.model} - ${group.finish}`}
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
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Aro
                </span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">
                  {group.size}
                </span>
              </div>
              <div className="w-px h-12 bg-gray-100 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Furação
                </span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">
                  {group.boltPattern}
                </span>
              </div>
              <div className="w-px h-12 bg-gray-100 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Acabamento
                </span>
                <span className="text-2xl font-black text-gray-900 uppercase italic">
                  {group.finish}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA */}
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

  // vídeo sempre mudo (extra seguro)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [activeIndex]);

  // garante índice válido se mudar lista
  useEffect(() => {
    if (activeIndex > mediaList.length - 1) {
      setActiveIndex(0);
      setMediaLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaList.length]);

  const changeMedia = (i: number) => {
    setMediaLoading(true);
    setActiveIndex(i);
  };

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < mediaList.length - 1;

  const goPrev = () => changeMedia(Math.max(0, activeIndex - 1));
  const goNext = () => changeMedia(Math.min(mediaList.length - 1, activeIndex + 1));

  // se não houver mídia, não fica preso no loading
  useEffect(() => {
    if (mediaList.length === 0) setMediaLoading(false);
  }, [mediaList.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start pb-20 border-b border-gray-50 last:border-0">
      <div className="space-y-6">
        {/* MÍDIA PRINCIPAL */}
        <div className="aspect-square bg-white rounded-[3rem] overflow-hidden relative border-2 border-gray-100 shadow-sm flex items-center justify-center">
          {/* Overlay animado enquanto carrega */}
          {mediaLoading && mediaList.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
              {/* shimmer + pulse premium */}
              <div className="w-full h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                <div className="absolute -inset-y-10 -left-1/2 w-[200%] rotate-12 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.2s_infinite]" />
                <div className="absolute bottom-10 left-10 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    carregando mídia
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Setas do carrossel */}
          {mediaList.length > 1 && (
            <>
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 shadow-xl backdrop-blur bg-white/90 transition-all active:scale-95 ${!hasPrev ? "opacity-30 cursor-not-allowed" : "hover:bg-white"
                  }`}
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goNext}
                disabled={!hasNext}
                className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 shadow-xl backdrop-blur bg-white/90 transition-all active:scale-95 ${!hasNext ? "opacity-30 cursor-not-allowed" : "hover:bg-white"
                  }`}
                aria-label="Próximo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/70 text-white text-[10px] font-black uppercase tracking-widest">
                {activeIndex + 1}/{mediaList.length}
              </div>
            </>
          )}

          {/* Conteúdo da mídia (só aparece quando carregou) */}
          {mediaList.length > 0 ? (
            mediaList[activeIndex].type === "video" ? (
              <video
                ref={videoRef}
                key={mediaList[activeIndex].url}
                src={mediaList[activeIndex].url}
                controls
                autoPlay
                muted
                playsInline
                onLoadedData={() => setMediaLoading(false)}
                onError={() => setMediaLoading(false)}
                className={`w-full h-full object-cover bg-white transition-opacity duration-300 ${mediaLoading ? "opacity-0" : "opacity-100"
                  }`}
              />
            ) : (
              <img
                key={mediaList[activeIndex].url}
                src={mediaList[activeIndex].url}
                onLoad={() => setMediaLoading(false)}
                onError={() => setMediaLoading(false)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${mediaLoading ? "opacity-0" : "opacity-100"
                  }`}
                alt={`Unidade ${index + 1} - mídia ${activeIndex + 1}`}
              />
            )
          ) : (
            <div className="flex flex-col items-center text-gray-200 gap-4">
              <CameraOff size={60} />
              <span className="text-xs font-black uppercase tracking-widest">
                Sem mídia
              </span>
            </div>
          )}
        </div>

        {/* THUMBS */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {mediaList.map((media, i) => (
            <button
              key={i}
              onClick={() => changeMedia(i)}
              className={`min-w-[110px] h-[110px] rounded-[1.5rem] overflow-hidden border-4 transition-all relative active:scale-95 ${activeIndex === i
                  ? "border-blue-600 scale-105 shadow-md opacity-100"
                  : "border-white opacity-40 hover:opacity-70 hover:scale-[1.02]"
                }`}
              aria-label={`Abrir mídia ${i + 1}`}
            >
              {media.type === "video" ? (
                <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center">
                  <Video className="text-blue-600 mb-1" size={28} />
                  <span className="text-[10px] font-black text-blue-600 uppercase">
                    Vídeo
                  </span>
                </div>
              ) : (
                <img src={media.url} className="w-full h-full object-cover" alt="" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TEXTO + BOTÃO */}
      <div className="flex flex-col h-full justify-between pt-4">
        <div className="space-y-12">
          <h3 className="text-6xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
            UNIDADE #{index + 1}
          </h3>

          <div>
            <label className="text-[12px] font-black text-blue-600 uppercase tracking-[0.25em] block mb-5">
              Inspeção de Avarias
            </label>
            <div className="flex flex-wrap gap-3">
              {item.defects.map((d) => (
                <span
                  key={d}
                  className="px-6 py-3 bg-red-600 text-white text-[13px] font-black uppercase rounded-2xl shadow-xl transition-transform hover:scale-[1.02]"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border-2 border-gray-100 shadow-inner transition-transform hover:scale-[1.01]">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-4">
              Relatório do Especialista
            </label>
            <p className="text-gray-800 leading-relaxed text-2xl font-bold italic">
              "{item.description || "Unidade inspecionada."}"
            </p>
          </div>
        </div>

        <button
          onClick={onShare}
          className="mt-16 w-full bg-[#25D366] hover:bg-[#1fae53] text-white py-7 rounded-[2rem] font-black uppercase text-xl flex items-center justify-center gap-5 shadow-2xl transition-all active:scale-95 hover:translate-y-[-1px]"
        >
          <Share2 size={32} />
          Compartilhar Imagens
        </button>
      </div>

      {/* CSS da animação shimmer (coloque no seu global CSS se preferir) */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-30%) rotate(12deg); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateX(30%) rotate(12deg); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default WheelDetail;
