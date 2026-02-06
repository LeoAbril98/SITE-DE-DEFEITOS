import React, { useMemo, useState } from "react";
import { WheelGroup, IndividualWheel } from "../../types/wheel";
import {
  Share2,
  CameraOff,
  Video,
  ChevronLeft,
  X,
  CheckCircle2,
  Copy,
  Loader2,
} from "lucide-react";
import { resolveFinishImage } from "../../utils/finishResolver";

interface WheelDetailProps {
  group: WheelGroup;
  onBack: () => void;
}

const optimizeMedia = (url: string, width?: number, isPoster?: boolean) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/") && isPoster) {
    return url.replace("/video/upload/", "/video/upload/f_auto,q_auto,so_0/").replace(".mp4", ".jpg");
  }
  if (url.includes("/video/upload/")) {
    return url.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
  }
  const params = `f_auto,q_auto${width ? `,w_${width}` : ""}`;
  return url.replace("/upload/", `/upload/${params}/`);
};

const WheelDetail: React.FC<WheelDetailProps> = ({ group, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: IndividualWheel; index: number } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState({ active: false, current: 0, total: 0 });

  const folder = group.model.toLowerCase().trim().replace(/\s+/g, "");
  const finishFileName = resolveFinishImage(group.finish);
  const catalogUrl = finishFileName ? `/modelos/${folder}/${finishFileName}` : `/modelos/${folder}/CAPA.jpg`;

  const getTechnicalMessage = (index: number) => {
    const currentUrl = window.location.href;
    const bolt = (group.boltPattern || (group as any).bolt_pattern || "").toString();
    const technicalInfo = `${group.model} ${group.size} ${bolt} ${group.finish}`;
    return `*MKR RODAS - RELATÓRIO TÉCNICO*\n\n${technicalInfo.toUpperCase()}\n*Unidade:* #${index + 1}\n\n🔗 *Link:* ${currentUrl}`;
  };

  const copyToClipboard = async (index: number) => {
    try {
      await navigator.clipboard.writeText(getTechnicalMessage(index));
      alert("Texto técnico copiado!");
    } catch {
      alert("Não foi possível copiar. Tente novamente.");
    }
  };

  const executeShare = async (item: IndividualWheel, index: number, isMobile: boolean) => {
    const allMedia = [...(item.photos || []), ...(item.video_url ? [item.video_url] : [])];
    setDownloadStatus({ active: true, current: 0, total: allMedia.length });

    try {
      const filesToShare: File[] = [];
      // No mobile limitamos a 4 mídias para evitar timeout do sistema operacional
      const mediaToProcess = isMobile ? allMedia.slice(0, 4) : allMedia;

      for (let i = 0; i < mediaToProcess.length; i++) {
        setDownloadStatus(prev => ({ ...prev, current: i + 1 }));
        
        const response = await fetch(optimizeMedia(mediaToProcess[i], 1200));
        if (!response.ok) throw new Error("Erro ao baixar arquivo");
        const blob = await response.blob();

        if (!isMobile) {
          // Desktop: Download Direto
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          const isVid = mediaToProcess[i].includes(".mp4") || mediaToProcess[i].includes("/video/");
          link.download = `mkr_${group.model}_un_${index + 1}_${i + 1}.${isVid ? 'mp4' : 'jpg'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          await new Promise(r => setTimeout(r, 300)); // Delay para não travar o browser
        } else {
          // Mobile: Prepara arquivo para o Share API
          const isVid = mediaToProcess[i].includes(".mp4") || mediaToProcess[i].includes("/video/");
          filesToShare.push(new File([blob], `mkr_midia_${i + 1}.${isVid ? 'mp4' : 'jpg'}`, {
            type: isVid ? "video/mp4" : "image/jpeg"
          }));
        }
      }

      if (isMobile) {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: filesToShare })) {
          await navigator.share({
            files: filesToShare,
            text: getTechnicalMessage(index),
          });
        } else {
          // Fallback WhatsApp se o navegador não suportar envio de arquivos
          window.open(`https://wa.me/?text=${encodeURIComponent(getTechnicalMessage(index))}`, "_blank");
        }
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Erro no compartilhamento:", err);
      alert("Houve um problema ao processar as mídias.");
    } finally {
      setDownloadStatus({ active: false, current: 0, total: 0 });
    }
  };

  const handleShareClick = (item: IndividualWheel, index: number) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setSelectedItem({ item, index });
    setIsModalOpen(true);

    // Se for mobile, já inicia o processo automaticamente ao abrir o modal
    if (isMobile) {
      executeShare(item, index, true);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white text-gray-900 font-sans w-full overflow-x-hidden">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-black uppercase text-gray-400 hover:text-black mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-4 border-gray-50 pb-12">
        <div className="flex items-start gap-4 sm:gap-6 min-w-0">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 flex-shrink-0">
            <img
              src={catalogUrl}
              className="w-full h-full object-cover"
              alt={group.model}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallbackUrl = group.wheels?.[0]?.photos?.[0];
                if (fallbackUrl) target.src = optimizeMedia(fallbackUrl, 400);
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-blue-600 font-black uppercase text-xs tracking-[0.2em] block mb-2">{group.brand}</span>
            <h1 className="text-4xl md:text-7xl font-black italic uppercase text-gray-900 leading-none tracking-tighter break-words">
              {group.model}
            </h1>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:gap-10">
              <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Aro</span><span className="text-xl font-black italic">{group.size}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Furação</span><span className="text-xl font-black italic">{group.boltPattern || (group as any).bolt_pattern}</span></div>
              <div className="flex flex-col col-span-2 sm:col-span-1"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Acabamento</span><span className="text-xl font-black italic break-words">{group.finish}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE RODAS */}
      <div className="space-y-32">
        {group.wheels.map((item, index) => (
          <IndividualWheelCard key={item.id} item={item} index={index} onShare={() => handleShareClick(item, index)} />
        ))}
      </div>

      {/* MODAL DE STATUS */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
            <button 
                onClick={() => { if(!downloadStatus.active) setIsModalOpen(false) }} 
                className="absolute top-6 right-6 text-gray-400 hover:text-black disabled:opacity-30"
                disabled={downloadStatus.active}
            >
              <X size={24} />
            </button>
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                {downloadStatus.active ? <Loader2 className="w-10 h-10 animate-spin text-blue-600" /> : <Share2 className="text-blue-600 w-10 h-10" />}
              </div>
              
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">
                {downloadStatus.active ? "Processando Mídias" : "Relatório Técnico"}
              </h2>

              <div className="space-y-4 text-left bg-gray-50 p-6 rounded-3xl border border-gray-100">
                {downloadStatus.active ? (
                  <div className="text-center py-2">
                    <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">
                      Baixando arquivos ({downloadStatus.current}/{downloadStatus.total})
                    </p>
                    <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full transition-all duration-300" 
                            style={{ width: `${(downloadStatus.current / downloadStatus.total) * 100}%` }}
                        />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 items-start"><CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" /><p className="font-bold italic text-sm text-gray-900">Download das fotos e vídeos.</p></div>
                    <div className="flex gap-3 items-start"><CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" /><p className="font-bold italic text-sm text-gray-900">Texto técnico para WhatsApp.</p></div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  disabled={downloadStatus.active}
                  onClick={() => executeShare(selectedItem.item, selectedItem.index, false)}
                  className="py-6 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 transition-all"
                >
                  {downloadStatus.active ? "Aguarde..." : "Gerar Relatório (Download)"}
                </button>
                <button 
                  onClick={() => copyToClipboard(selectedItem.index)} 
                  className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-gray-100 text-gray-400 hover:text-black flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> Copiar Texto Técnico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IndividualWheelCard: React.FC<{ item: IndividualWheel; index: number; onShare: () => void; }> = ({ item, index, onShare }) => {
  const photos = item.photos || [];
  const mediaList = useMemo(() => [
    ...photos.map((u) => ({ type: "image" as const, url: u })),
    ...(item.video_url ? [{ type: "video" as const, url: item.video_url }] : []),
  ], [photos, item.video_url]);
  const [active, setActive] = useState(0);

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start border-b border-gray-50 pb-20 last:border-0 w-full">
      <div className="space-y-6">
        <div className="aspect-square bg-white rounded-[2rem] overflow-hidden border-2 border-gray-100 shadow-sm relative flex items-center justify-center">
          {mediaList.length > 0 ? (
            mediaList[active].type === "video" ? (
              <video src={optimizeMedia(mediaList[active].url)} poster={optimizeMedia(mediaList[active].url, 1000, true)} controls muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={optimizeMedia(mediaList[active].url, 1200)} className="w-full h-full object-cover" alt="" />
            )
          ) : <CameraOff size={60} className="text-gray-200" />}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {mediaList.map((m, i) => (
            <button key={i} onClick={() => setActive(i)} className={`min-w-[90px] h-[90px] rounded-[1.2rem] overflow-hidden border-4 transition-all ${active === i ? "border-blue-600 scale-105" : "border-white opacity-40"}`}>
              {m.type === "video" ? <div className="w-full h-full bg-blue-50 flex items-center justify-center"><Video className="text-blue-600" /></div> : <img src={optimizeMedia(m.url, 200)} className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col h-full justify-between pt-4">
        <div className="space-y-8">
          <h3 className="text-4xl sm:text-6xl font-black italic uppercase leading-none tracking-tighter text-gray-900">Unidade #{index + 1}</h3>
          <div className="flex flex-wrap gap-2">{(item.defects || []).map((d) => <span key={d} className="px-4 py-2 bg-red-600 text-white text-[11px] font-black uppercase rounded-xl">{d}</span>)}</div>
          <div className="bg-gray-50/50 p-6 rounded-[1.5rem] border-2 border-gray-100 italic font-bold text-xl text-gray-800">"{item.description || "Inspecionada conforme padrão MKR."}"</div>
        </div>
        <button onClick={onShare} className="mt-12 w-full bg-[#25D366] text-white py-6 rounded-[1.5rem] font-black uppercase text-lg flex items-center justify-center gap-5 shadow-2xl active:scale-95 transition-transform">
          <Share2 size={28} /> Compartilhar Relatório
        </button>
      </div>
    </div>
  );
};

export default WheelDetail;
