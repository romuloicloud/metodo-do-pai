import React from 'react';

interface Props {
    onStart: () => void;
}

const DiagnosticWelcome: React.FC<Props> = ({ onStart }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
            {/* Ícone animado */}
            <div className="relative mb-8">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-5xl shadow-2xl shadow-amber-500/30 animate-bounce">
                    🧠
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-sm font-bold text-green-900 animate-ping">
                    ✓
                </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 mb-3 font-display">
                Vamos descobrir seu nível! 🚀
            </h1>

            {/* Subtítulo */}
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-sm font-grotesk">
                Responda <span className="text-amber-300 font-bold">10 questões rápidas</span> para o Pai montar seu plano de estudos <span className="text-green-400 font-bold">personalizado!</span>
            </p>

            {/* Infos */}
            <div className="flex gap-4 mb-10">
                <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2.5 border border-slate-700/50">
                    <span className="text-lg">⏱️</span>
                    <span className="text-xs text-slate-300 font-grotesk">Sem tempo limite</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2.5 border border-slate-700/50">
                    <span className="text-lg">📝</span>
                    <span className="text-xs text-slate-300 font-grotesk">5 PT + 5 MAT</span>
                </div>
            </div>

            {/* Mensagem encorajadora */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-5 mb-8 max-w-sm">
                <p className="text-sm text-indigo-200 italic font-grotesk leading-relaxed">
                    "Não se preocupe se errar! Cada erro é uma chance do Pai te ensinar algo novo. Vamos juntos!" 💪
                </p>
            </div>

            {/* Botão principal */}
            <button
                onClick={onStart}
                className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 active:scale-95"
            >
                COMEÇAR DIAGNÓSTICO
            </button>
        </div>
    );
};

export default DiagnosticWelcome;
