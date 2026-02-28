import React, { useState, useEffect } from 'react';
import { JourneyPhase } from '../types';
import { getJourneyPhases, getDaysUntilExam, getJourneyProgress } from '../services/journeyService';
import { supabase } from '../services/supabaseClient';

interface Props {
    onSelectPhase: (phase: JourneyPhase) => void;
}

const JourneyMap: React.FC<Props> = ({ onSelectPhase }) => {
    const [phases, setPhases] = useState<JourneyPhase[]>([]);
    const [loading, setLoading] = useState(true);
    const daysLeft = getDaysUntilExam();
    const progress = getJourneyProgress(phases);

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const p = await getJourneyPhases(session.user.id);
                setPhases(p);
            }
            setLoading(false);
        };
        load();
    }, []);

    const getPhaseStyle = (phase: JourneyPhase) => {
        switch (phase.status) {
            case 'completed':
                return {
                    bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
                    border: 'border-green-400',
                    text: 'text-white',
                    shadow: 'shadow-green-500/30',
                    icon: '✅',
                };
            case 'current':
                return {
                    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
                    border: 'border-amber-300',
                    text: 'text-white',
                    shadow: 'shadow-amber-500/40',
                    icon: '⭐',
                };
            default:
                return {
                    bg: 'bg-slate-700/50',
                    border: 'border-slate-600',
                    text: 'text-slate-500',
                    shadow: '',
                    icon: '🔒',
                };
        }
    };

    const renderStars = (count: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                    <span key={i} className={`text-sm ${i <= count ? 'text-amber-400' : 'text-slate-600'}`}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-300 font-grotesk">Carregando sua Jornada...</p>
            </div>
        );
    }

    // Se não há fases, significa que a jornada ainda não foi inicializada
    if (phases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-6 text-center">
                <div className="text-6xl mb-6">🗺️</div>
                <h2 className="text-xl font-bold text-white mb-3 font-display">Sua Jornada está sendo preparada!</h2>
                <p className="text-slate-400 font-grotesk text-sm">Complete o Diagnóstico para desbloquear sua Jornada personalizada.</p>
            </div>
        );
    }

    // Inverter para exibir de baixo para cima (fase 1 = embaixo)
    const reversedPhases = [...phases].reverse();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-y-auto pb-32">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 font-display">
                        🗺️ Minha Jornada
                    </h1>
                    <div className="flex items-center gap-2 bg-slate-800/80 rounded-full px-3 py-1.5">
                        <span className="text-sm">⏱️</span>
                        <span className="text-xs text-amber-300 font-bold font-grotesk">
                            {daysLeft} dias para a prova
                        </span>
                    </div>
                </div>
                {/* Barra de progresso geral */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 via-green-400 to-emerald-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-bold font-grotesk w-12 text-right">{progress}%</span>
                </div>
            </header>

            {/* Mapa de fases */}
            <div className="px-6 pt-8 flex flex-col items-center">
                {reversedPhases.map((phase, index) => {
                    const style = getPhaseStyle(phase);
                    const isLast = index === reversedPhases.length - 1;

                    return (
                        <div key={phase.phaseNumber} className="flex flex-col items-center w-full max-w-sm">
                            {/* Linha conectora */}
                            {index > 0 && (
                                <div className={`w-1 h-10 rounded-full ${phase.status === 'locked' ? 'bg-slate-700' : 'bg-gradient-to-b from-green-500/50 to-amber-500/50'
                                    }`} />
                            )}

                            {/* Card da fase */}
                            <button
                                onClick={() => phase.status !== 'locked' && onSelectPhase(phase)}
                                disabled={phase.status === 'locked'}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${style.border} ${phase.status === 'current'
                                        ? `${style.bg} shadow-xl ${style.shadow} scale-105 ring-4 ring-amber-400/20`
                                        : phase.status === 'completed'
                                            ? `bg-slate-800/60 ${style.shadow}`
                                            : 'bg-slate-800/30 cursor-not-allowed'
                                    }`}
                            >
                                {/* Número/ícone da fase */}
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${style.bg} shadow-lg ${style.shadow}`}>
                                    <span className="text-lg">{style.icon}</span>
                                    <span className={`text-xs font-bold ${style.text}`}>{phase.phaseNumber}</span>
                                </div>

                                {/* Info da fase */}
                                <div className="flex-1 text-left">
                                    <p className={`text-sm font-bold font-display ${phase.status === 'locked' ? 'text-slate-500' : 'text-white'
                                        }`}>
                                        {phase.topic}
                                    </p>
                                    <p className={`text-xs font-grotesk ${phase.status === 'locked' ? 'text-slate-600' : 'text-slate-400'
                                        }`}>
                                        {phase.subject}
                                    </p>
                                    {phase.status === 'completed' && renderStars(phase.stars)}
                                    {phase.status === 'current' && (
                                        <span className="text-xs text-amber-200 font-bold font-grotesk animate-pulse">
                                            ▶ Fase atual
                                        </span>
                                    )}
                                </div>

                                {/* Arrow ou lock */}
                                <span className={`text-lg ${phase.status === 'locked' ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {phase.status === 'locked' ? '🔒' : '→'}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JourneyMap;
