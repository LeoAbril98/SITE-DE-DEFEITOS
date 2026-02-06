import React, { useMemo, useState, useEffect } from "react";
import { WheelGroup, IndividualWheel } from "../../types/wheel";
import {
  Share2,
  CameraOff,
  Video,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Copy,
  Loader2,
  Check
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

// --- TOAST NOTIFICATION ---
const Toast = ({ message, onClose }: { message: string | null, onClose: () => void }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-1"><Check size={12} className="text-white" strokeWidth={4} /></div>
                <span className="font-bold text-sm uppercase tracking-wide">{message}</span>
            </div>
        </div>
    );
};

const WheelDetail: React.FC<WheelDetailProps> = ({ group, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: IndividualWheel; index: number; } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState({ active: false, current: 0, total: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const folder = group.model.toLowerCase().trim().replace(/\s+/g, "");
  const finishFileName = resolveFinishImage(group.finish);
  const catalogUrl = finishFileName ? `/modelos/${folder}/${finishFileName}` : `/modelos/${folder}/CAPA.jpg`;

  const getTechnicalMessage = (index: number) => {
    const currentUrl = window.location.href;
    const bolt = (group.boltPattern || (group as any).bolt_pattern || "").toString();
    const technicalInfo = `${group.model} ${group.size} ${bolt} ${group.finish}`;
    return `*MKR RODAS - RELATÓRIO TÉCNICO*\n\n${technicalInfo.toUpperCase()}\n*Unidade:* #${index + 1}\n\n🔗 *Link:* ${currentUrl}`;
  };

  const handleShareClick = (item: IndividualWheel, index: number) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setSelectedItem({ item, index });
    setIsModalOpen(true);
    if (isMobile) executeShare(item, index, true);
  };

  const executeShare = async (item: IndividualWheel, index: number, isMobile: boolean) => {
    const allMedia = [...(item.photos || []), ...(item.video_url ? [item.video_url] : [])];
    setDownloadStatus({ active: true, current: 0, total: allMedia.length });

    try {
      if (!isMobile) {
        for (let i = 0; i < allMedia.length; i++) {
          setDownloadStatus((prev) => ({ ...prev, current: i + 1 }));
          const response = await fetch(optimizeMedia(allMedia[i], 1200));
          const blob = await response.blob();
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          const ext = allMedia[i].includes("/video/") ? "mp4" : "jpg";
          link.download = `mkr_${group.model}_u${index + 1}_${i + 1}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise((r) => setTimeout(r, 400));
        }
        setToastMessage("Download concluído com sucesso!");
      } else if (allMedia.length > 0 && navigator.share) {
        const filesToShare: File[] = [];
        const mediaToProcess = allMedia.slice(0, 4);
        for (let i = 0; i < mediaToProcess.length; i++) {
          setDownloadStatus((prev) => ({ ...prev, current: i + 1 }));
          const response = await fetch(optimizeMedia(mediaToProcess[i], 800));
          const blob = await response.blob();
          const isVideo = mediaToProcess[i].includes("/video/");
          filesToShare.push(new File([blob], `mkr_${i}.${isVideo ? "mp4" : "jpg"}`, { type: isVideo ? "video/mp4" : "image/jpeg" }));
        }
        await navigator.share({ files: filesToShare, text: getTechnicalMessage(index) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMobile && downloadStatus.active) {
        window.open(`https://wa.me/?text=${encodeURIComponent(getTechnicalMessage(index))}`, "_blank");
      }
      setDownloadStatus({ active: false, current: 0, total: 0 });
      setIsModalOpen(false);
    }
  };

  const copyToClipboard = async (index: number) => {
    try { 
        await navigator.clipboard.writeText(getTechnicalMessage(index)); 
        setToastMessage("Texto técnico copiado!"); 
    } catch { 
        setToastMessage("Erro ao copiar."); 
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in bg-white text-gray-900 font-sans w-full overflow-x-hidden">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <button onClick={onBack} className="flex items-center gap-2 text-sm font-black uppercase text-gray-400 hover:text-black mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-4 border-gray-50 pb-12">
        <div className="flex items-start gap-4 sm:gap-6 min-w-0">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 flex-shrink-0">
            <img src={catalogUrl} className="w-full h-full object-cover" alt={group.model} onError={(e) => { const t = e.target as HTMLImageElement; if(group.wheels?.[0]?.photos?.[0]) t.src = optimizeMedia(group.wheels[0].photos[0], 400); }} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-blue-600 font-black uppercase text-xs tracking-[0.2em] block mb-2">{group.brand}</span>
            <h1 className="text-4xl md:text-7xl font-black italic uppercase text-gray-900 leading-none tracking-tighter break-words">{group.model}</h1>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:gap-10">
              <div className="flex flex-col text-gray-900 min-w-0"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aro</span><span className="text-xl sm:text-2xl font-black italic uppercase">{group.size}</span></div>
              <div className="flex flex-col text-gray-900 min-w-0"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Furação</span><span className="text-xl sm:text-2xl font-black italic uppercase">{group.boltPattern || (group as any).bolt_pattern}</span></div>
              <div className="flex flex-col text-gray-900 min-w-0 col-span-2 sm:col-span-1"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Acabamento</span><span className="text-xl sm:text-2xl font-black italic uppercase break-words leading-tight">{group.finish}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-32">
        {group.wheels.map((item, index) => (
          <IndividualWheelCard 
            key={item.id} item={item} index={index} 
            onShare={() => handleShareClick(item, index)} 
          />
        ))}
      </div>

      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24} /></button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto"><Share2 className="text-blue-600 w-10 h-10" /></div>
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">
                  {downloadStatus.active ? "Preparando Mídias" : "Relatório Técnico"}
              </h2>
              <div className="space-y-4 text-left bg-gray-50 p-6 rounded-3xl border border-gray-100">
                {downloadStatus.active ? (
                  <div className="flex flex-col items-center gap-4 py-4 w-full">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Baixando ({downloadStatus.current}/{downloadStatus.total})</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 items-start"><CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" /><p className="font-bold italic text-sm text-gray-900">Download automático de mídias.</p></div>
                    <div className="flex gap-3 items-start"><CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" /><p className="font-bold italic text-sm text-gray-900">Mensagem formatada para WhatsApp.</p></div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button disabled={downloadStatus.active} onClick={() => executeShare(selectedItem.item, selectedItem.index, false)} className={`py-6 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 transition-all ${downloadStatus.active ? "bg-blue-600 text-white" : "bg-black text-white hover:bg-gray-800 shadow-xl"}`}>
                  {downloadStatus.active ? "Processando..." : "Gerar e Enviar Relatório"}
                </button>
                <button onClick={() => copyToClipboard(selectedItem.index)} className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-gray-100 text-gray-400 hover:text-black hover:border-black flex items-center justify-center gap-2">
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

const IndividualWheelCard: React.FC<{ item: IndividualWheel; index: number; onShare: () => void }> = ({ item, index, onShare }) => {
  const photos = item.photos || [];
  const mediaList = useMemo(() => [ ...photos.map((u) => ({ type: "image" as const, url: u })), ...(item.video_url ? [{ type: "video" as const, url: item.video_url }] : []) ], [photos, item.video_url]);
  const [active, setActive] = useState(0);

  const next = () => setActive((prev) => (prev + 1) % mediaList.length);
  const prev = () => setActive((prev) => (prev - 1 + mediaList.length) % mediaList.length);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) next(); 
    if (distance < -50) prev();
    setTouchStart(null); setTouchEnd(null);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-start border-b border-gray-50 pb-20 last:border-0 w-full overflow-x-hidden">
      <div className="space-y-6 min-w-0">
        <div 
            className="group relative aspect-square bg-white rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-2 border-gray-100 shadow-sm flex items-center justify-center"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        >
          {mediaList.length > 0 ? ( mediaList[active].type === "video" ? <video src={optimizeMedia(mediaList[active].url)} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={optimizeMedia(mediaList[active].url, 1200)} className="w-full h-full object-cover" alt="" /> ) : <CameraOff size={60} className="text-gray-200" />}
          
          {mediaList.length > 1 && ( <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all sm:opacity-0 group-hover:opacity-100"><ChevronLeft size={20} /></button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all sm:opacity-0 group-hover:opacity-100"><ChevronRight size={20} /></button>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 px-10">{mediaList.map((_, i) => (<div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-white shadow-md" : "w-2 bg-white/40"}`} />))}</div>
          </> )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide max-w-full">
          {mediaList.map((m, i) => (
            <button key={i} onClick={() => setActive(i)} className={`min-w-[90px] h-[90px] sm:min-w-[110px] sm:h-[110px] rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border-4 transition-all ${active === i ? "border-blue-600 scale-105 shadow-md" : "border-white opacity-40 hover:opacity-70"}`}>
              {m.type === "video" ? <div className="w-full h-full bg-blue-50 flex items-center justify-center"><Video className="text-blue-600" /></div> : <img src={optimizeMedia(m.url, 200)} className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col h-full justify-between pt-4 min-w-0">
        <div className="space-y-8 sm:space-y-12 min-w-0">
          <h3 className="text-4xl sm:text-6xl font-black italic uppercase leading-none tracking-tighter text-gray-900 break-words">Unidade #{index + 1}</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">{(item.defects || []).map((d) => <span key={d} className="px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white text-[11px] sm:text-[13px] font-black uppercase rounded-xl sm:rounded-2xl shadow-lg break-words">{d}</span>)}</div>
          <div className="bg-gray-50/50 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-gray-100 italic font-bold text-xl sm:text-2xl text-gray-800 leading-relaxed break-words">"{item.description || "Inspecionada conforme padrão MKR."}"</div>
        </div>
        <button onClick={onShare} className="mt-12 sm:mt-16 w-full bg-[#25D366] text-white py-6 sm:py-7 rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase text-lg sm:text-xl flex items-center justify-center gap-5 shadow-2xl transition-all active:scale-95"><Share2 size={28} /> Compartilhar Relatório</button>
      </div>
    </div>
  );
};

export default WheelDetail;
