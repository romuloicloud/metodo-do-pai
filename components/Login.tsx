import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            if (isLoginMode) {
                // Handle Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                // Handle Sign Up
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });
                if (error) throw error;
                setMessage('Conta criada com sucesso! Verifique seu e-mail para confirmação.');
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background-dark flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto text-center">
                <img src="/assets/IMG_6432.JPG" alt="Método do Pai" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary/50 object-cover" />
                <h1 className="text-3xl font-bold text-white mb-2 font-display">Método do Pai</h1>
                <p className="text-slate-400 mb-8">Sua preparação inteligente para Pedro II e FAETEC.</p>

                <div className="bg-surface-dark p-8 rounded-xl border border-slate-800">
                    <h2 className="font-bold text-white text-lg mb-1">{isLoginMode ? 'Acesse sua conta' : 'Crie sua conta'}</h2>
                    <p className="text-slate-500 text-sm mb-6">{isLoginMode ? 'Bem-vindo de volta!' : 'Comece sua jornada de aprovação.'}</p>
                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {!isLoginMode && (
                             <div className="relative">
                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                                <input
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:outline-none"
                                    type="text"
                                    placeholder="Nome do Aluno"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="relative">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">mail</span>
                            <input
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:outline-none"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                         <div className="relative">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                            <input
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:outline-none"
                                type="password"
                                placeholder="Sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processando...' : (isLoginMode ? 'Entrar' : 'Criar Conta')}
                        </button>
                    </form>
                    
                    <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-center text-sm mt-6 text-slate-400 hover:text-white transition-colors">
                        {isLoginMode ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Faça login"}
                    </button>

                    {message && <p className="text-center text-sm mt-4 text-green-400">{message}</p>}
                    {error && <p className="text-center text-sm mt-4 text-red-400">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Login;
