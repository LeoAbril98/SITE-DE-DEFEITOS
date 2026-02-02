import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; 
import { groupWheels } from "../features/wheels/wheelGroupAdapter";
import WheelDetail from "../features/wheels/WheelDetail";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Loader2, AlertCircle } from "lucide-react";

const WheelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWheelData() {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);

        // 1. Busca a roda específica pelo UUID único enviado pelo catálogo
        // Como o ID agora é um UUID válido, o Supabase não retornará erro de sintaxe
        const { data: refWheel, error: refError } = await supabase
          .from("individual_wheels")
          .select("*")
          .eq("id", id) 
          .single();

        if (refError) {
          console.error("Erro ao buscar referência UUID:", refError);
          throw new Error("Não encontramos esta unidade específica.");
        }

        if (refWheel) {
          // 2. Busca todas as unidades "irmãs" com a mesma configuração técnica
          // Isso garante que se houver 4 rodas do mesmo jogo, todas apareçam aqui
          const { data: allUnits, error: allUnitsError } = await supabase
            .from("individual_wheels")
            .select("*")
            .eq("model", refWheel.model)
            .eq("size", refWheel.size)
            .eq("bolt_pattern", refWheel.bolt_pattern)
            .eq("finish", refWheel.finish);

          if (allUnitsError) throw allUnitsError;

          if (allUnits && allUnits.length > 0) {
            // Agrupa as unidades para o formato de exibição do componente WheelDetail
            const groups = groupWheels(allUnits);
            setGroup(groups[0]);
          }
        }
      } catch (err: any) {
        console.error("Falha no carregamento dos detalhes:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWheelData();
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <Header />
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
            <p className="text-gray-400 mb-8 max-w-xs text-sm font-medium">
              {error || "Não foi possível carregar os dados desta roda."}
            </p>
            <button 
              onClick={() => navigate("/")} 
              className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform"
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
