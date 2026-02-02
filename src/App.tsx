import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import Login from './pages/Login';
import WheelDetailPage from './pages/WheelDetailPage'; // Nova página

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">Carregando...</div>;
  if (!session) return <Navigate to="/login" />;

  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      {/* Rota principal do catálogo */}
      <Route path="/" element={<CatalogPage />} />

      {/* Rota dinâmica para detalhe da roda */}
      <Route path="/roda/:id" element={<WheelDetailPage />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      
      {/* Fallback para rotas não encontradas */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
