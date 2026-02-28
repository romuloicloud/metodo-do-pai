import React, { useState } from 'react';
import { DiagnosticAnswer, DiagnosticResult as DiagResult } from '../types';

interface Props {
    result: DiagResult;
    onStartJourney: () => void;
}

const DiagnosticResult: React.FC<Props> = ({ result, onStartJourney }) => {
    const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);
    const totalQuestions = result.answers.length;
    const percentage = totalQuestions > 0 ? Math.round((result.scoreTotal / totalQuestions) * 100) : 0;

    const getScoreColor = () => {
        if (percentage >= 70) return { ring: 'text-green-400', bg: 'from-green-500/20', label: 'Mandou bem! 🌟' };
        if (percentage >= 50) return { ring: 'text-amber-400', bg: 'from-amber-500/20', label: 'Bom começo! 💪' };
        return { ring: 'text-red-400', bg: 'from-red-500/20', label: 'Vamos melhorar! 🚀' };
    };

    const scoreStyle = getScoreColor();
    const wrongAnswers = result.answers.filter(a => !a.isCorrect);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 px-6 py-8 overflow-y-auto pb-32">
            {/* Header */}
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 text-center mb-2 font-display">
                Seu Resultado Diagnóstico
            </h1>
            <p className="text-slate-400 text-center text-sm font-grotesk mb-8">{scoreStyle.label}</p>

            {/* Score circular */}
            <div className="flex justify-center mb-8">
                <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                        <circle
                            cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                            className={scoreStyle.ring}
                            strokeDasharray={`${percentage * 2.64} 264`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black ${scoreStyle.ring}`}>{result.scoreTotal}/{totalQuestions}</span>
                        <span className="text-xs text-slate-400 font-grotesk">acertos</span>
                    </div>
                </div>
            </div>

            {/* Barras por matéria */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400 text-lg">📖</span>
                        <span className="text-blue-300 text-sm font-bold font-grotesk">Português</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl font-black text-white">{result.scorePortugues}</span>
                        <span className="text-slate-400 text-sm mb-0.5">/5</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full mt-2">
                        <div className="h-full bg-blue-400 rounded-full transition-all"
                            style={{ width: `${(result.scorePortugues / 5) * 100}%` }} />
                    </div>
                </div>
                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400 text-lg">🔢</span>
                        <span className="text-green-300 text-sm font-bold font-grotesk">Matemática</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl font-black text-white">{result.scoreMatematica}</span>
                        <span className="text-slate-400 text-sm mb-0.5">/5</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full mt-2">
                        <div className="h-full bg-green-400 rounded-full transition-all"
                            style={{ width: `${(result.scoreMatematica / 5) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Pontos a melhorar */}
            {result.weakTopics.length > 0 && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-300 text-sm font-bold mb-2 font-grotesk">📍 Pontos a Melhorar</p>
                    <div className="flex flex-wrap gap-2">
                        {result.weakTopics.map((topic, i) => (
                            <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Pontos fortes */}
            {result.strongTopics.length > 0 && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <p className="text-green-300 text-sm font-bold mb-2 font-grotesk">💪 Pontos Fortes</p>
                    <div className="flex flex-wrap gap-2">
                        {result.strongTopics.map((topic, i) => (
                            <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Mensagem do Pai */}
            <div className="mb-6 p-5 bg-indigo-900/30 border border-indigo-500/30 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl">
                        🧠
                    </div>
                    <span className="text-amber-300 font-bold text-sm font-display">O Pai diz:</span>
                </div>
                <p className="text-sm text-indigo-200 italic font-grotesk leading-relaxed">
                    {percentage >= 70
                        ? `"Boa, campeão! Você acertou ${result.scoreTotal} de ${totalQuestions}! Já tem uma base firme. Agora vamos polir os detalhes na sua Jornada!" 🌟`
                        : percentage >= 50
                            ? `"Bom começo! Acertou ${result.scoreTotal} de ${totalQuestions}. A gente vai trabalhar os pontos que faltam juntos. Cada fase da Jornada vai te deixar mais forte!" 💪`
                            : `"Sem problemas, campeão! O importante é que agora eu sei exatamente onde te ajudar. A Jornada vai ser feita sob medida pra você melhorar! Vamos juntos!" 🚀`
                    }
                </p>
            </div>

            {/* Revisão dos erros com IA */}
            {wrongAnswers.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-white mb-4 font-display">📋 Revisão dos Erros ({wrongAnswers.length})</h2>
                    <div className="space-y-3">
                        {wrongAnswers.map((answer, index) => (
                            <div key={index} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                                <button
                                    onClick={() => setExpandedAnswer(expandedAnswer === index ? null : index)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-red-400 text-lg">❌</span>
                                        <div>
                                            <p className="text-sm text-white font-bold font-grotesk line-clamp-1">{answer.questionText}</p>
                                            <p className="text-xs text-slate-400 font-grotesk">{answer.subject} · {answer.topic}</p>
                                        </div>
                                    </div>
                                    <span className={`text-slate-400 transition-transform ${expandedAnswer === index ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {expandedAnswer === index && answer.aiExplanation && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="p-3 bg-red-500/10 rounded-xl">
                                            <p className="text-xs text-red-300 font-bold mb-1">Sua resposta: {answer.options[answer.selectedOptionIndex]}</p>
                                            <p className="text-xs text-green-300 font-bold">Correta: {answer.options[answer.correctOptionIndex]}</p>
                                        </div>
                                        <div className="p-3 bg-amber-500/10 rounded-xl">
                                            <p className="text-xs text-amber-300 font-bold mb-1">💡 Pulo do Gato:</p>
                                            <p className="text-sm text-slate-200 font-grotesk">{answer.aiExplanation.keyInsight}</p>
                                        </div>
                                        {answer.aiExplanation.analogy && (
                                            <div className="p-3 bg-indigo-500/10 rounded-xl">
                                                <p className="text-xs text-indigo-300 font-bold mb-1">🎯 Analogia:</p>
                                                <p className="text-sm text-slate-200 font-grotesk">{answer.aiExplanation.analogy.text}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA - Começar Jornada */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
                <button
                    onClick={onStartJourney}
                    className="w-full max-w-md mx-auto block py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/30 transform hover:scale-[1.02] transition-all active:scale-95"
                >
                    COMEÇAR MINHA JORNADA →
                </button>
            </div>
        </div>
    );
};

export default DiagnosticResult;
