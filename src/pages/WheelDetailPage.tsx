import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { groupWheels } from "../features/wheels/wheelGroupAdapter";
import WheelDetail from "../features/wheels/WheelDetail";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Loader2 } from "lucide-react";

const WheelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWheelData() {
      if (!id) return;
      
      try {
        setLoading(true);

        // 1. Busca a roda específica pelo ID único da URL
        const { data: refWheel, error: refError } = await supabase
          .from("individual_wheels")
          .select("*")
          .eq("id", id)
          .single();

        if (refError) throw refError;

        if (refWheel) {
          // 2. Busca todas as unidades do mesmo modelo/aro/furação/acabamento
          const { data: allUnits, error: allUnitsError } = await supabase
            .from("individual_wheels")
            .select("*")
            .eq("model", refWheel.model)
            .eq("size", refWheel.size)
            .eq("bolt_pattern", refWheel.bolt_pattern)
            .eq("finish", refWheel.finish);

          if (allUnitsError) throw allUnitsError;

          if (allUnits && allUnits.length > 0) {
            // Agrupa os dados para o formato esperado pelo WheelDetail
            const groups = groupWheels(allUnits);
            setGroup(groups[0]);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
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
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="font-black uppercase tracking-widest text-gray-400 text-xs">Carregando inspeção...</p>
          </div>
        ) : group ? (
          <WheelDetail group={group} onBack={() => navigate(-1)} />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-black uppercase mb-4">Inspeção não encontrada</h2>
            <button 
              onClick={() => navigate("/")} 
              className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase text-sm"
            >
              Voltar ao catálogo
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WheelDetailPage;
