import React, { useEffect } from 'react';

interface Props {
    userEmail?: string;
    onLogout: () => void;
}

const PaywallScreen: React.FC<Props> = ({ userEmail, onLogout }) => {
    // Redirecionar para a landing page após 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            window.location.href = 'https://metododopai.com#preco';
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen w-full bg-background-dark flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto text-center">
                <span className="material-icons-round text-6xl text-yellow-400 mb-4 block">lock</span>
                <h1 className="text-2xl font-bold text-white mb-3 font-display">Acesso Restrito</h1>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                    A conta <strong className="text-white">{userEmail}</strong> não possui uma assinatura ativa.
                </p>

                <p className="text-slate-500 text-sm mb-6">
                    Você será redirecionado para a página de assinatura em 5 segundos...
                </p>

                <a
                    href="https://metododopai.com#preco"
                    className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors mb-4 text-center"
                >
                    ASSINAR AGORA
                </a>

                <button
                    onClick={onLogout}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Sair da conta
                </button>
            </div>
        </div>
    );
};

export default PaywallScreen;
