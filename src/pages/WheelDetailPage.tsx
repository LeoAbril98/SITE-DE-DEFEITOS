import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Verifique se o caminho está correto conforme seu projeto
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

        // Tentamos tratar o ID. Se o seu banco usa ID numérico, Number(id) resolve.
        // Se usa UUID, o próprio 'id' string funciona.
        const queryId = isNaN(Number(id)) ? id : Number(id);

        // 1. Busca a roda de referência para saber as especificações técnicas
        const { data: refWheel, error: refError } = await supabase
          .from("individual_wheels")
          .select("*")
          .eq("id", queryId)
          .single();

        if (refError) {
          console.error("Erro ao buscar referência:", refError);
          throw new Error("Não encontramos esta roda no banco de dados.");
        }

        if (refWheel) {
          // 2. Busca todas as unidades "irmãs" (mesma configuração técnica)
          const { data: allUnits, error: allUnitsError } = await supabase
            .from("individual_wheels")
            .select("*")
            .eq("model", refWheel.model)
            .eq("size", refWheel.size)
            .eq("bolt_pattern", refWheel.bolt_pattern)
            .eq("finish", refWheel.finish);

          if (allUnitsError) throw allUnitsError;

          if (allUnits && allUnits.length > 0) {
            // Agrupa as unidades individuais em um WheelGroup para o componente WheelDetail
            const groups = groupWheels(allUnits);
            setGroup(groups[0]);
          }
        } else {
          throw new Error("Roda não localizada.");
        }
      } catch (err: any) {
        console.error("Erro geral na página de detalhes:", err);
        setError(err.message || "Ocorreu um erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    }

    fetchWheelData();
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow pt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="font-black uppercase tracking-widest text-gray-400 text-[10px]">
              Sincronizando inspeção...
            </p>
          </div>
        ) : error || !group ? (
          <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-black uppercase italic mb-2">Inspeção não encontrada</h2>
            <p className="text-gray-500 mb-8 max-w-xs text-sm">
              O link pode estar expirado ou a roda foi removida do sistema.
            </p>
            <button 
              onClick={() => navigate("/")} 
              className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-transform active:scale-95 shadow-xl"
            >
              Voltar ao catálogo
            </button>
          </div>
        ) : (
          /* O componente WheelDetail agora recebe o grupo correto e a função de voltar */
          <WheelDetail group={group} onBack={() => navigate(-1)} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WheelDetailPage;
