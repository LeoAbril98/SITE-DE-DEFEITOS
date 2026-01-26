import React, { useEffect, useState } from 'react'; // Adicione 'React' aqui
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import Login from './pages/Login'; // Certifique-se de que o arquivo Login.tsx está na pasta src

// Componente para proteger a rota Admin
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se o usuário já está logado no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Carregando...</div>;

  // Se não houver sessão (usuário não logado), manda para o Login
  if (!session) return <Navigate to="/login" />;

  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      {/* Rota pública: Catálogo de rodas com defeitos */}
      <Route path="/" element={<CatalogPage />} />

      {/* Nova rota de Login */}
      <Route path="/login" element={<Login />} />

      {/* Rota protegida: Só acessa o Admin se estiver logado */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;