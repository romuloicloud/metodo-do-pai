import React, { useState } from 'react';
import { JourneyPhase as JPhase, Question, AiExplanation } from '../types';
import { updatePhaseProgress } from '../services/journeyService';
import { getAIExplanation } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface Props {
    phase: JPhase;
    onBack: () => void;
    onPhaseComplete: () => void;
}

const JourneyPhaseView: React.FC<Props> = ({ phase, onBack, onPhaseComplete }) => {
    const [activeStep, setActiveStep] = useState<'theory' | 'training' | 'boss'>(
        !phase.theoryDone ? 'theory' : !phase.trainingDone ? 'training' : 'boss'
    );
    const [trainingQuestions, setTrainingQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [bossComplete, setBossComplete] = useState(false);

    // Buscar questões para treino ou boss
    const loadQuestions = async (count: number) => {
        setIsLoadingQuestions(true);
        const subjectFilter = phase.subject === 'Português' ? '%Portugu%' : '%Matem%';

        const { data, error } = await supabase
            .from('questoes')
            .select('*')
            .ilike('subject', subjectFilter)
            .limit(50);

        if (error) {
            console.error('Erro buscando questões:', error);
            setIsLoadingQuestions(false);
            return;
        }

        // Embaralhar e pegar a quantidade necessária
        const shuffled = (data || []).sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count).map((q: any) => ({
            id: q.id,
            topic: q.topic || phase.topic,
            subject: q.subject?.includes('Portugu') ? 'Português' as const : 'Matemática' as const,
            text: q.text,
            baseText: q.base_text || undefined,
            imageUrl: q.image_url || undefined,
            imageUrl2: q.image_url_2 || undefined,
            options: q.options,
            correctOptionIndex: q.correct_option_index,
        }));

        setTrainingQuestions(selected);
        setCurrentQIndex(0);
        setCorrectCount(0);
        setSelectedOption(null);
        setIsRevealed(false);
        setTrainingComplete(false);
        setBossComplete(false);
        setIsLoadingQuestions(false);
    };

    const handleStartTraining = () => {
        setActiveStep('training');
        loadQuestions(5);
    };

    const handleStartBoss = () => {
        setActiveStep('boss');
        loadQuestions(1);
    };

    const handleSelectOption = async (optionIndex: number) => {
        if (isRevealed || !trainingQuestions[currentQIndex]) return;
        setSelectedOption(optionIndex);
        setIsRevealed(true);

        const q = trainingQuestions[currentQIndex];
        const isCorrect = optionIndex === q.correctOptionIndex;

        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
        } else {
            // IA do Pai explica!
            setIsAiLoading(true);
            setShowAiModal(true);
            try {
                const explanation = await getAIExplanation(q, q.options[optionIndex]);
                setAiExplanation(explanation);
            } catch {
                setAiExplanation(null);
            }
            setIsAiLoading(false);
        }
    };

    const handleNext = async () => {
        setShowAiModal(false);
        setAiExplanation(null);
        setSelectedOption(null);
        setIsRevealed(false);

        const isLastQuestion = currentQIndex + 1 >= trainingQuestions.length;

        if (isLastQuestion) {
            // Salvar progresso
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const total = trainingQuestions.length;
            const score = Math.round((correctCount / total) * 100);
            const stars = score >= 90 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;

            if (activeStep === 'training') {
                await updatePhaseProgress(session.user.id, phase.phaseNumber, {
                    trainingDone: true,
                    bestScore: Math.max(score, phase.bestScore),
                });
                setTrainingComplete(true);
            } else if (activeStep === 'boss') {
                await updatePhaseProgress(session.user.id, phase.phaseNumber, {
                    bossDone: true,
                    stars: Math.max(stars, phase.stars),
                    bestScore: Math.max(score, phase.bestScore),
                });
                setBossComplete(true);
            }
        } else {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handleMarkTheoryDone = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        await updatePhaseProgress(session.user.id, phase.phaseNumber, { theoryDone: true });
        setActiveStep('training');
        handleStartTraining();
    };

    const optionLabels = ['A', 'B', 'C', 'D'];
    const currentQ = trainingQuestions[currentQIndex];

    // Tela de passos
    if (activeStep === 'theory' || (activeStep !== 'training' && activeStep !== 'boss') || trainingQuestions.length === 0) {
        if (isLoadingQuestions) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-300 font-grotesk">Preparando questões...</p>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 px-6 py-8 pb-32">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors">
                        ←
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white font-display">Fase {phase.phaseNumber}: {phase.topic}</h1>
                        <p className="text-sm text-slate-400 font-grotesk">{phase.subject}</p>
                    </div>
                </div>

                {/* Melhor nota */}
                {phase.bestScore > 0 && (
                    <div className="flex items-center gap-2 mb-6 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                        <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => <span key={i} className={`text-lg ${i <= phase.stars ? 'text-amber-400' : 'text-slate-600'}`}>★</span>)}
                        </div>
                        <span className="text-amber-300 text-sm font-bold font-grotesk">Melhor nota: {phase.bestScore}%</span>
                    </div>
                )}

                {/* 3 Etapas */}
                <div className="space-y-4">
                    {/* Teoria */}
                    <div className={`p-5 rounded-2xl border-2 transition-all ${phase.theoryDone
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-indigo-500/10 border-indigo-500/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{phase.theoryDone ? '✅' : '📖'}</span>
                            <div>
                                <h3 className="text-white font-bold font-display">Teoria</h3>
                                <p className="text-xs text-slate-400 font-grotesk">Aprenda sobre {phase.topic}</p>
                            </div>
                        </div>
                        {!phase.theoryDone && (
                            <button onClick={handleMarkTheoryDone}
                                className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg active:scale-95 transition-transform">
                                Já estudei! Vamos treinar →
                            </button>
                        )}
                    </div>

                    {/* Treino */}
                    <div className={`p-5 rounded-2xl border-2 transition-all ${phase.trainingDone
                        ? 'bg-green-500/10 border-green-500/30'
                        : phase.theoryDone
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-slate-800/30 border-slate-700/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{phase.trainingDone ? '✅' : phase.theoryDone ? '🎯' : '🔒'}</span>
                            <div>
                                <h3 className={`font-bold font-display ${phase.theoryDone ? 'text-white' : 'text-slate-500'}`}>Treino (5 questões)</h3>
                                <p className="text-xs text-slate-400 font-grotesk">Erre e o Pai te explica!</p>
                            </div>
                        </div>
                        {phase.theoryDone && !phase.trainingDone && (
                            <button onClick={handleStartTraining}
                                className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg active:scale-95 transition-transform">
                                Iniciar Treino 🎯
                            </button>
                        )}
                    </div>

                    {/* Boss */}
                    <div className={`p-5 rounded-2xl border-2 transition-all ${phase.bossDone
                        ? 'bg-green-500/10 border-green-500/30'
                        : phase.trainingDone
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-slate-800/30 border-slate-700/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{phase.bossDone ? '✅' : phase.trainingDone ? '⚔️' : '🔒'}</span>
                            <div>
                                <h3 className={`font-bold font-display ${phase.trainingDone ? 'text-white' : 'text-slate-500'}`}>Boss (Questão de Prova Real)</h3>
                                <p className="text-xs text-slate-400 font-grotesk">Desafio com questão oficial!</p>
                            </div>
                        </div>
                        {phase.trainingDone && !phase.bossDone && (
                            <button onClick={handleStartBoss}
                                className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg active:scale-95 transition-transform">
                                Enfrentar o Boss ⚔️
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Tela de completar treino/boss
    if (trainingComplete || bossComplete) {
        const total = trainingQuestions.length;
        const score = Math.round((correctCount / total) * 100);

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 px-6 text-center">
                <div className="text-6xl mb-6">{score >= 60 ? '🎉' : '💪'}</div>
                <h2 className="text-2xl font-black text-white mb-2 font-display">
                    {bossComplete ? 'Boss Derrotado!' : 'Treino Completo!'}
                </h2>
                <p className="text-amber-300 text-lg font-bold mb-4">{correctCount}/{total} acertos ({score}%)</p>
                <div className="flex gap-1 mb-8">
                    {[1, 2, 3].map(i => {
                        const stars = score >= 90 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;
                        return <span key={i} className={`text-3xl ${i <= stars ? 'text-amber-400' : 'text-slate-600'}`}>★</span>;
                    })}
                </div>
                <button
                    onClick={bossComplete ? onPhaseComplete : () => { setTrainingComplete(false); setTrainingQuestions([]); }}
                    className="w-full max-w-xs py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg active:scale-95 transition-transform"
                >
                    {bossComplete ? 'Próxima Fase →' : 'Voltar para a Fase'}
                </button>
            </div>
        );
    }

    // Tela de questão (treino ou boss)
    if (!currentQ) return null;

    return (
        <div className="relative flex flex-col min-h-screen bg-slate-900">
            {/* Header */}
            <header className="px-6 pt-6 pb-3">
                <div className="flex justify-between items-center mb-3">
                    <span className={`text-sm font-bold font-grotesk ${activeStep === 'boss' ? 'text-purple-300' : 'text-amber-300'}`}>
                        {activeStep === 'boss' ? '⚔️ BOSS' : '🎯 TREINO'} · Fase {phase.phaseNumber}
                    </span>
                    <span className="text-slate-400 text-sm font-grotesk">
                        {currentQIndex + 1} de {trainingQuestions.length}
                    </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${activeStep === 'boss'
                        ? 'bg-gradient-to-r from-purple-400 to-pink-500'
                        : 'bg-gradient-to-r from-amber-400 to-green-500'
                        }`}
                        style={{ width: `${((currentQIndex) / trainingQuestions.length) * 100}%` }}
                    />
                </div>
            </header>

            {/* Questão */}
            <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32">
                <div className="mb-6">
                    {currentQ.baseText && (
                        <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl max-h-48 overflow-y-auto shadow-inner">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap font-grotesk leading-relaxed">{currentQ.baseText}</p>
                        </div>
                    )}
                    {currentQ.imageUrl && (
                        <div className="mb-4 flex justify-center">
                            <img src={currentQ.imageUrl} alt="Questão" className="max-w-full rounded-xl border border-slate-700" />
                        </div>
                    )}
                    {currentQ.imageUrl2 && (
                        <div className="mb-4 flex justify-center">
                            <img src={currentQ.imageUrl2} alt="Questão (parte 2)" className="max-w-full rounded-xl border border-slate-700" />
                        </div>
                    )}
                    <h2 className="text-lg font-bold text-white leading-snug font-display">{currentQ.text}</h2>
                </div>

                <div className="space-y-3">
                    {currentQ.options.map((option, index) => {
                        let bgClass = 'bg-slate-800/60 border-slate-700 hover:border-indigo-500';
                        if (isRevealed) {
                            if (index === currentQ.correctOptionIndex) bgClass = 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50';
                            else if (index === selectedOption) bgClass = 'bg-red-500/20 border-red-500 ring-2 ring-red-500/50';
                            else bgClass = 'bg-slate-800/30 border-slate-700/50 opacity-50';
                        }
                        return (
                            <button key={index} onClick={() => handleSelectOption(index)} disabled={isRevealed}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${bgClass}`}>
                                <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isRevealed && index === currentQ.correctOptionIndex ? 'bg-green-500 text-white'
                                    : isRevealed && index === selectedOption ? 'bg-red-500 text-white'
                                        : 'bg-slate-700 text-slate-300'
                                    }`}>{optionLabels[index]}</span>
                                <span className="text-sm text-slate-200 text-left font-grotesk">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {isRevealed && !showAiModal && (
                    <div className="mt-6">
                        <button onClick={handleNext}
                            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg active:scale-95 transition-transform">
                            {currentQIndex + 1 >= trainingQuestions.length ? 'Ver Resultado 🎯' : 'Próxima →'}
                        </button>
                    </div>
                )}
            </main>

            {/* Modal IA */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-indigo-500/30 shadow-2xl">
                        {isAiLoading ? (
                            <div className="flex flex-col items-center py-8">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mb-4 animate-pulse">🧠</div>
                                <p className="text-slate-300 font-grotesk text-sm">O Pai está pensando...</p>
                            </div>
                        ) : aiExplanation ? (
                            <>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">🧠</div>
                                    <div>
                                        <h3 className="text-amber-300 font-bold font-display">O Pai diz:</h3>
                                        <p className="text-slate-400 text-xs font-grotesk">Método do Pai · Correção</p>
                                    </div>
                                </div>
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-xs text-red-300 font-bold mb-1 font-grotesk">👀 Olha só:</p>
                                    <p className="text-sm text-slate-200 font-grotesk leading-relaxed">{aiExplanation.attentionDetail}</p>
                                </div>
                                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <p className="text-xs text-amber-300 font-bold mb-1 font-grotesk">💡 Pulo do Gato:</p>
                                    <p className="text-sm text-slate-200 font-grotesk leading-relaxed">{aiExplanation.keyInsight}</p>
                                </div>
                                {aiExplanation.analogy && (
                                    <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <p className="text-xs text-indigo-300 font-bold mb-1 font-grotesk">🎯 Pense assim:</p>
                                        <p className="text-sm text-slate-200 font-grotesk leading-relaxed">{aiExplanation.analogy.text}</p>
                                    </div>
                                )}
                                {aiExplanation.quickChallenge && (
                                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                        <p className="text-xs text-green-300 font-bold mb-1 font-grotesk">⚡ Desafio Relâmpago:</p>
                                        <p className="text-sm text-slate-200 font-grotesk">{aiExplanation.quickChallenge.question}</p>
                                        <p className="text-sm text-green-300 font-bold mt-1 font-grotesk">→ {aiExplanation.quickChallenge.correctAnswer}</p>
                                    </div>
                                )}
                                <button onClick={() => { setShowAiModal(false); handleNext(); }}
                                    className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg mt-2 active:scale-95 transition-transform">
                                    Entendi! {currentQIndex + 1 >= trainingQuestions.length ? 'Ver Resultado' : 'Próxima →'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-300 font-grotesk">Erro na IA. Continue!</p>
                                <button onClick={() => { setShowAiModal(false); handleNext(); }}
                                    className="mt-4 px-6 py-2 rounded-xl bg-indigo-500 text-white font-bold">
                                    Continuar →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JourneyPhaseView;
