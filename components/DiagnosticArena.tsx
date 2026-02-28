import React, { useState, useEffect, useCallback } from 'react';
import { Question, DiagnosticAnswer, AiExplanation } from '../types';
import { supabase } from '../services/supabaseClient';
import { fetchDiagnosticQuestions } from '../services/diagnosticService';
import { getAIExplanation } from '../services/geminiService';

interface Props {
    onComplete: (answers: DiagnosticAnswer[]) => void;
}

const DiagnosticArena: React.FC<Props> = ({ onComplete }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const loadQuestions = async () => {
            const qs = await fetchDiagnosticQuestions();
            setQuestions(qs);
            setIsLoading(false);
        };
        loadQuestions();
    }, []);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;

    const handleSelectOption = async (optionIndex: number) => {
        if (isRevealed) return;
        setSelectedOption(optionIndex);
        setIsRevealed(true);

        const isCorrect = optionIndex === currentQuestion.correctOptionIndex;

        const answer: DiagnosticAnswer = {
            questionId: currentQuestion.id,
            questionText: currentQuestion.text,
            subject: currentQuestion.subject,
            topic: currentQuestion.topic,
            selectedOptionIndex: optionIndex,
            correctOptionIndex: currentQuestion.correctOptionIndex,
            isCorrect,
            options: currentQuestion.options,
        };

        if (isCorrect) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1500);
            setAnswers(prev => [...prev, answer]);
        } else {
            // IA do Pai explica o erro!
            setIsAiLoading(true);
            setShowAiModal(true);
            try {
                const explanation = await getAIExplanation(
                    currentQuestion,
                    currentQuestion.options[optionIndex]
                );
                setAiExplanation(explanation);
                answer.aiExplanation = explanation;
            } catch {
                setAiExplanation(null);
            }
            setIsAiLoading(false);
            setAnswers(prev => [...prev, answer]);
        }
    };

    const handleNext = () => {
        setShowAiModal(false);
        setAiExplanation(null);
        setSelectedOption(null);
        setIsRevealed(false);

        if (currentIndex + 1 >= totalQuestions) {
            onComplete([...answers]);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleCloseAiModal = () => {
        setShowAiModal(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-300 font-grotesk">Preparando suas questões...</p>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <p className="text-slate-300 font-grotesk">Nenhuma questão encontrada.</p>
            </div>
        );
    }

    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <div className="relative flex flex-col min-h-screen bg-slate-900">
            {/* Confetti */}
            {showConfetti && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="text-7xl animate-bounce">🎉</div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 pt-6 pb-3">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-amber-300 text-sm font-bold font-grotesk">
                        🧪 DIAGNÓSTICO
                    </span>
                    <span className="text-slate-400 text-sm font-grotesk">
                        {currentIndex + 1} de {totalQuestions}
                    </span>
                </div>
                {/* Barra de progresso */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-amber-400 via-green-400 to-emerald-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </header>

            {/* Questão */}
            <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32">
                <div className="mb-6">
                    {/* Badge matéria/tópico */}
                    <div className="flex gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuestion.subject === 'Português'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-green-500/20 text-green-300'
                            }`}>
                            {currentQuestion.subject.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                            {currentQuestion.topic}
                        </span>
                    </div>

                    {/* Texto base */}
                    {currentQuestion.baseText && (
                        <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl max-h-48 overflow-y-auto shadow-inner">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap font-grotesk leading-relaxed">{currentQuestion.baseText}</p>
                        </div>
                    )}

                    {/* Imagem */}
                    {currentQuestion.imageUrl && (
                        <div className="mb-4 flex justify-center">
                            <img src={currentQuestion.imageUrl} alt="Imagem da questão" className="max-w-full rounded-xl border border-slate-700" />
                        </div>
                    )}
                    {currentQuestion.imageUrl2 && (
                        <div className="mb-4 flex justify-center">
                            <img src={currentQuestion.imageUrl2} alt="Imagem da questão (parte 2)" className="max-w-full rounded-xl border border-slate-700" />
                        </div>
                    )}

                    {/* Enunciado */}
                    <h2 className="text-lg font-bold text-white leading-snug font-display">
                        {currentQuestion.text}
                    </h2>
                </div>

                {/* Opções */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        let bgClass = 'bg-slate-800/60 border-slate-700 hover:border-indigo-500';
                        if (isRevealed) {
                            if (index === currentQuestion.correctOptionIndex) {
                                bgClass = 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50';
                            } else if (index === selectedOption && index !== currentQuestion.correctOptionIndex) {
                                bgClass = 'bg-red-500/20 border-red-500 ring-2 ring-red-500/50 animate-shake';
                            } else {
                                bgClass = 'bg-slate-800/30 border-slate-700/50 opacity-50';
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleSelectOption(index)}
                                disabled={isRevealed}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${bgClass}`}
                            >
                                <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isRevealed && index === currentQuestion.correctOptionIndex
                                    ? 'bg-green-500 text-white'
                                    : isRevealed && index === selectedOption
                                        ? 'bg-red-500 text-white'
                                        : 'bg-slate-700 text-slate-300'
                                    }`}>
                                    {optionLabels[index]}
                                </span>
                                <span className="text-sm text-slate-200 text-left font-grotesk">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Botão Próxima (só após responder) */}
                {isRevealed && !showAiModal && (
                    <div className="mt-6">
                        <button
                            onClick={handleNext}
                            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg transform hover:scale-[1.02] transition-all active:scale-95"
                        >
                            {currentIndex + 1 >= totalQuestions ? 'VER MEU RESULTADO 🎯' : 'PRÓXIMA →'}
                        </button>
                    </div>
                )}
            </main>

            {/* Modal IA do Pai */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
                        {isAiLoading ? (
                            <div className="flex flex-col items-center py-8">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 animate-pulse overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/30">
                                    <img alt="Avatar do Método do Pai" className="w-full h-full object-cover" src="/assets/avatar-pai.jpg" />
                                </div>
                                <p className="text-slate-300 font-grotesk text-sm">O Pai está pensando...</p>
                            </div>
                        ) : aiExplanation ? (
                            <>
                                {/* Header do modal */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg overflow-hidden border-2 border-amber-400">
                                        <img alt="Avatar do Método do Pai" className="w-full h-full object-cover" src="/assets/avatar-pai.jpg" />
                                    </div>
                                    <div>
                                        <h3 className="text-amber-300 font-bold font-display">O Pai diz:</h3>
                                        <p className="text-slate-400 text-xs font-grotesk">Método do Pai · Correção</p>
                                    </div>
                                </div>

                                {/* Atenção ao detalhe */}
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-xs text-red-300 font-bold mb-1 font-grotesk">👀 Olha só o que aconteceu:</p>
                                    <p className="text-sm text-slate-200 font-grotesk leading-relaxed">{aiExplanation.attentionDetail}</p>
                                </div>

                                {/* Pulo do Gato */}
                                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <p className="text-xs text-amber-300 font-bold mb-1 font-grotesk">💡 Pulo do Gato:</p>
                                    <p className="text-sm text-slate-200 font-grotesk leading-relaxed">{aiExplanation.keyInsight}</p>
                                </div>

                                {/* Analogia */}
                                {aiExplanation.analogy && (
                                    <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <p className="text-xs text-indigo-300 font-bold mb-1 font-grotesk">🎯 Pense assim:</p>
                                        <p className="text-sm text-slate-200 font-grotesk leading-relaxed">{aiExplanation.analogy.text}</p>
                                    </div>
                                )}

                                {/* Desafio Relâmpago */}
                                {aiExplanation.quickChallenge && (
                                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                        <p className="text-xs text-green-300 font-bold mb-1 font-grotesk">⚡ Desafio Relâmpago:</p>
                                        <p className="text-sm text-slate-200 font-grotesk">{aiExplanation.quickChallenge.question}</p>
                                        <p className="text-sm text-green-300 font-bold mt-1 font-grotesk">→ {aiExplanation.quickChallenge.correctAnswer}</p>
                                    </div>
                                )}

                                {/* Botão fechar */}
                                <button
                                    onClick={() => { handleCloseAiModal(); handleNext(); }}
                                    className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg mt-2 transform hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    Entendi! {currentIndex + 1 >= totalQuestions ? 'Ver Resultado 🎯' : 'Próxima →'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-300 font-grotesk">A IA não conseguiu gerar a explicação. Continue!</p>
                                <button onClick={() => { handleCloseAiModal(); handleNext(); }}
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

export default DiagnosticArena;
