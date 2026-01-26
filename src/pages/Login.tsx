import React, { useState } from 'react'; // Adicione o 'React' aqui
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert("Erro ao logar: " + error.message);
        } else {
            // Sucesso! Vai para a página admin que você já criou
            navigate('/admin');
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Start Inteligente</h2>
                <p style={styles.subtitle}>Acesso Administrativo</p>

                <form onSubmit={handleLogin} style={styles.form}>
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Sua senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
                    >
                        {loading ? 'Entrando...' : 'Acessar Painel'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Estilos básicos para o Admin não ficar "feio"
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
    },
    card: {
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center' as const,
        width: '100%',
        maxWidth: '400px'
    },
    title: { margin: 0, color: '#333' },
    subtitle: { color: '#666', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
    input: {
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '16px'
    },
    button: {
        padding: '12px',
        backgroundColor: '#000',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold' as const
    }
};