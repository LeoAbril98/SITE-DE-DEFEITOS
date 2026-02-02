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
        
        console.log("ID recebido da URL:", id);

        // Tentativa 1: Buscar como número (se o seu ID no Supabase for 'int8' ou 'serial')
        // Tentativa 2: Buscar como string (se for UUID ou texto)
        const queryId = isNaN(Number(id)) ? id : Number(id);
        console.log("ID processado para consulta:", queryId);

        // 1. Busca a roda de referência
        const { data: refWheel, error: refError } = await supabase
          .from("individual_wheels")
          .select("*")
          .eq("id", queryId)
          .maybeSingle(); // maybeSingle não dá erro se não achar, apenas retorna null

        if (refError) {
          console.error("Erro do Supabase na busca por ID:", refError);
          throw new Error(refError.message);
        }

        if (!refWheel) {
          console.warn("Nenhum registro encontrado para o ID:", queryId);
          // TENTATIVA DE BACKUP: Buscar pelo modelo caso o ID falhe (apenas para teste)
          throw new Error("Roda não localizada no banco de dados.");
        }

        console.log("Roda de referência encontrada:", refWheel.model);

        // 2. Busca o grupo técnico completo
        const { data: allUnits, error: allUnitsError } = await supabase
          .from("individual_wheels")
          .select("*")
          .eq("model", refWheel.model)
          .eq("size", refWheel.size)
          .eq("bolt_pattern", refWheel.bolt_pattern)
          .eq("finish", refWheel.finish);

        if (allUnitsError) throw allUnitsError;

        if (allUnits && allUnits.length > 0) {
          const groups = groupWheels(allUnits);
          console.log("Grupos gerados:", groups.length);
          setGroup(groups[0]);
        } else {
          throw new Error("Não foi possível carregar as unidades deste modelo.");
        }

      } catch (err: any) {
        console.error("Falha no carregamento:", err);
        setError(err.message);
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
            <p className="font-black uppercase tracking-widest text-gray-400 text-[10px]">Carregando dados técnicos...</p>
          </div>
        ) : error || !group ? (
          <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-black uppercase italic mb-2">Inspeção não encontrada</h2>
            <p className="text-gray-400 mb-8 max-w-xs text-sm font-medium">
              Erro: {error || "Grupo de dados vazio"}
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
