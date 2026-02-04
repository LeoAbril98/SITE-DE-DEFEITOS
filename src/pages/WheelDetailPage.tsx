import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";
import WheelDetail from "../features/wheels/WheelDetail";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Loader2, AlertCircle, ChevronLeft, ChevronUp } from "lucide-react";

const SCROLL_THRESHOLD = 250;

const WheelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados de Dados
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Interface
  const [showFloatingElements, setShowFloatingElements] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);

  /* ============================================================
     1. RESET DE SCROLL
     ============================================================ */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  /* ============================================================
     2. BUSCA DE DADOS (SUPABASE) - CORREÇÃO DE AGRUPAMENTO POR COR
     ============================================================ */
  useEffect(() => {
    async function fetchWheelData() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Busca a unidade específica de referência pelo ID
        const { data: refWheel, error: refError } = await supabase
          .from("individual_wheels")
          .select("*")
          .eq("id", id)
          .single();

        if (refError) throw new Error("Não encontramos esta unidade específica.");

        if (refWheel) {
          // 2. Busca TODAS as unidades do mesmo modelo/aro/furação
          const { data: allUnits, error: allUnitsError } = await supabase
            .from("individual_wheels")
            .select("*")
            .eq("model", refWheel.model)
            .eq("size", refWheel.size)
            .eq("bolt_pattern", refWheel.bolt_pattern);

          if (allUnitsError) throw allUnitsError;

          if (allUnits && allUnits.length > 0) {
            // 3. FILTRO MANUAL: Resolve o bug de estoque misturado
            // Filtramos apenas as unidades que possuem o MESMO acabamento (cor) da roda clicada
            const sameFinishUnits = allUnits.filter(
              (w) => w.finish === refWheel.finish
            );

            // O adaptador agora recebe apenas rodas da mesma cor, isolando o estoque
            const groups = groupWheels(sameFinishUnits);
            setGroup(groups[0]);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWheelData();
  }, [id]);

  /* ============================================================
     3. MONITORAMENTO DE SCROLL
     ============================================================ */
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingElements(window.scrollY > SCROLL_THRESHOLD);

      const headerEl = document.querySelector('header');
      if (headerEl) {
        setHeaderHeight(headerEl.getBoundingClientRect().height);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // overflow-x-hidden adicionado para evitar scroll lateral no mobile
    <div className="flex flex-col min-h-screen bg-white text-gray-900 relative overflow-x-hidden">
      <Header />

      {/* BOTÃO VOLTAR FLUTUANTE */}
      {showFloatingElements && !loading && !error && (
        <div
          className="fixed left-4 z-[60] transition-all duration-300 animate-in slide-in-from-left-5"
          style={{ top: `${headerHeight + 20}px` }}
        >
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-3 sm:px-5 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl hover:bg-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-900">
              Voltar
            </span>
          </button>
        </div>
      )}

      {/* BOTÃO VOLTAR AO TOPO */}
      {showFloatingElements && !loading && !error && (
        <div className="fixed right-4 bottom-6 sm:right-8 sm:bottom-8 z-[60] animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group p-3 sm:p-4 rounded-2xl bg-black text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-all active:scale-90 border border-white/10"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      )}

      <main className="flex-grow pt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="font-black uppercase tracking-widest text-gray-400 text-[10px]">
              Carregando relatório técnico...
            </p>
          </div>
        ) : error || !group ? (
          <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-black uppercase italic mb-2">Inspeção não encontrada</h2>
            <button
              onClick={() => navigate("/")}
              className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest mt-4"
            >
              Voltar ao catálogo
            </button>
          </div>
        ) : (
          <WheelDetail group={group} onBack={() => navigate(-1)} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WheelDetailPage;