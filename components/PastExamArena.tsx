import React, { useState, useEffect } from 'react';
import { Question, AiExplanation, Exam } from '../types';
import { validateExamAnswer } from '../services/geminiService';
import { saveResult } from '../services/statsService';
// FIX: Imported supabase client to get the user ID for saving results.
import { supabase } from '../services/supabaseClient';
import { SmartToyIcon, CheckCircleIcon, CloseIcon } from './icons';

const AiTutorModal: React.FC<{ explanation: AiExplanation | null; onClose: () => void; isLoading: boolean }> = ({ explanation, onClose, isLoading }) => {
    return (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col justify-end">
            <div className="flex flex-col items-center mb-[-24px] z-30">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(22,75,182,0.5)] border-4 border-primary overflow-hidden">
                    <img alt="Avatar do Método do Pai" className="w-full h-full object-cover" src="/assets/avatar-pai.jpg" />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl px-6 pt-10 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col max-h-[80%]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center p-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <h3 className="mt-4 font-bold text-slate-700 dark:text-slate-300">Analisando sua resposta...</h3>
                        <p className="text-sm text-slate-500">O Pai está consultando o edital para te dar a melhor explicação!</p>
                    </div>
                ) : explanation && (
                    <>
                        <p className="text-center font-serif italic text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Assinatura do Pai</p>
                        <div className="text-center mb-6 shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Opa! Quase lá... 🚀</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">O "Método do Pai" te ajuda!</p>
                        </div>
                        <div className="space-y-4 mb-4 overflow-y-auto pr-2 flex-1">
                            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                                <p className="text-sm font-bold text-primary dark:text-blue-300 mb-1">Ponto de Atenção</p>
                                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{explanation.attentionDetail}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Visão do Pai (Conexão com Edital)</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{explanation.keyInsight}"</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shrink-0 transition-colors">
                            <span>Entendi, continuar prova!</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};


interface PastExamArenaProps {
    exam: Exam;
    onFinishExam: () => void;
}

const PastExamArena: React.FC<PastExamArenaProps> = ({ exam, onFinishExam }) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showTutor, setShowTutor] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
    const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [isLoading, setIsLoading] = useState(false);
    const [activeQuestions, setActiveQuestions] = useState<Question[]>(exam.questions);
    // Armazena respostas de cada questão para permitir navegação
    const [answers, setAnswers] = useState<Record<number, { selected: number; correct: boolean }>>({});

    useEffect(() => {
        if (exam.id.startsWith('cp2-') || exam.id.startsWith('faetec-')) {
            const fetchQuestions = async () => {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('questoes')
                    .select('*')
                    .eq('exam_id', exam.id)
                    .order('question_number', { ascending: true });

                if (error) {
                    console.error('Error fetching questions:', error);
                    setIsLoading(false);
                    return;
                }

                if (data && data.length > 0) {
                    const mappedQuestions: Question[] = data.map((q: any) => ({
                        id: q.id,
                        subject: q.subject,
                        topic: q.topic,
                        text: q.text,
                        baseText: q.base_text,
                        imageUrl: q.image_url,
                        imageUrl2: q.image_url_2 || undefined,
                        options: q.options,
                        correctOptionIndex: q.correct_option_index,
                    }));

                    // Herança de texto-base: quando uma questão referencia um texto (ex: "Texto III")
                    // busca na questão anterior o texto mais completo com a mesma referência
                    for (let i = 1; i < mappedQuestions.length; i++) {
                        const current = mappedQuestions[i];
                        if (!current.baseText) continue;

                        // Extrair referência ao texto (ex: "TEXTO I", "Texto II", "TEXTO III")
                        const textoMatch = current.baseText.match(/^(TEXTO?\s+(?:I{1,3}V?|V?I{0,3}))\b/i);
                        if (!textoMatch) continue;
                        const textoRef = textoMatch[1].toUpperCase().replace(/\s+/g, ' ');

                        // Buscar para trás a questão com mesma referência e texto MAIS LONGO
                        for (let j = i - 1; j >= 0; j--) {
                            const prev = mappedQuestions[j];
                            if (!prev.baseText) continue;
                            const prevMatch = prev.baseText.match(/^(TEXTO?\s+(?:I{1,3}V?|V?I{0,3}))\b/i);
                            if (!prevMatch) continue;
                            const prevRef = prevMatch[1].toUpperCase().replace(/\s+/g, ' ');
                            if (prevRef === textoRef && prev.baseText.length > current.baseText.length) {
                                mappedQuestions[i] = { ...current, baseText: prev.baseText };
                                break;
                            }
                        }
                    }

                    setActiveQuestions(mappedQuestions);
                }
                setIsLoading(false);
            };

            fetchQuestions();
        } else {
            setActiveQuestions(exam.questions);
        }
    }, [exam.id]);

    useEffect(() => {
        setImageError(false);
        setStartTime(Date.now());
    }, [questionIndex]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <h2 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Carregando Prova...</h2>
                <p className="text-sm text-slate-500">O Pai está buscando as questões para você!</p>
            </div>
        );
    }

    const currentQuestion = activeQuestions[questionIndex];

    if (!currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                <span className="material-icons-round text-6xl mb-4 opacity-20">inventory_2</span>
                <p>Nenhuma questão encontrada para esta prova.</p>
                <button onClick={onFinishExam} className="mt-4 text-primary font-bold">Voltar</button>
            </div>
        );
    }

    const navigateToQuestion = (newIndex: number) => {
        setShowTutor(false);
        setAiExplanation(null);
        setQuestionIndex(newIndex);
        // Restaurar estado da resposta se já foi respondida
        const prevAnswer = answers[newIndex];
        if (prevAnswer) {
            setSelectedOption(prevAnswer.selected);
            setIsCorrect(prevAnswer.correct);
        } else {
            setSelectedOption(null);
            setIsCorrect(null);
        }
    };

    const handleNextQuestion = () => {
        if (questionIndex < activeQuestions.length - 1) {
            navigateToQuestion(questionIndex + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handlePreviousQuestion = () => {
        if (questionIndex > 0) {
            navigateToQuestion(questionIndex - 1);
        }
    };

    const handleAnswer = async (optionIndex: number) => {
        if (isCorrect !== null) return;

        const timeTaken = (Date.now() - startTime) / 1000;
        setSelectedOption(optionIndex);
        const correct = optionIndex === currentQuestion.correctOptionIndex;
        setIsCorrect(correct);

        // Salvar resposta para permitir navegação
        setAnswers(prev => ({ ...prev, [questionIndex]: { selected: optionIndex, correct } }));

        // FIX: Get user from supabase and pass the ID to saveResult to associate the result with the user.
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await saveResult(user.id, currentQuestion.subject, currentQuestion.topic, correct, timeTaken);
        }

        if (correct) {
            setScore(s => s + 1);
            setTimeout(handleNextQuestion, 1200);
        } else {
            setIsLoadingExplanation(true);
            setShowTutor(true);
            const explanation = await validateExamAnswer(currentQuestion, currentQuestion.options[optionIndex]);
            setAiExplanation(explanation);
            setIsLoadingExplanation(false);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getOptionClasses = (index: number) => {
        let classes = 'w-full p-4 text-left border rounded-xl transition-all flex items-center gap-4 ';
        if (selectedOption === index) {
            classes += isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20';
        } else if (isCorrect !== null && index === currentQuestion.correctOptionIndex) {
            classes += 'border-green-500 bg-green-50 dark:bg-green-900/20';
        } else {
            classes += 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-800 hover:border-primary/40 focus:border-primary active:bg-primary/5';
        }
        return classes;
    };

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <span className="material-icons-round text-6xl text-custom-gold mb-4">emoji_events</span>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Simulado Concluído!</h2>
                <p className="text-slate-500 mb-6">{exam.name}</p>
                <p className="text-4xl font-black text-primary">{score} / {activeQuestions.length}</p>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-8">ACERTOS</p>
                <button onClick={onFinishExam} className="w-full max-w-xs bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-full">
                    Voltar ao Centro de Estudos
                </button>
            </div>
        )
    }

    return (
        <div className="relative h-full flex flex-col w-full max-w-3xl mx-auto">
            <header className="px-6 py-4 flex flex-col gap-2">
                <button onClick={onFinishExam} className="flex items-center gap-1 text-sm text-slate-500 self-start">
                    <span className="material-icons-round text-base">close</span>
                    Sair do Simulado
                </button>
                <div className="flex justify-between items-center">
                    <h1 className="text-sm font-bold text-primary dark:text-blue-400 truncate">{exam.name}</h1>
                    <span className="text-sm font-bold text-slate-400">QUESTÃO {questionIndex + 1}/{activeQuestions.length}</span>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">{currentQuestion.subject} • {currentQuestion.topic}</span>
                    {currentQuestion.baseText && (
                        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg max-h-80 overflow-y-auto shadow-inner">
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-grotesk leading-relaxed">{currentQuestion.baseText}</p>
                        </div>
                    )}
                    <h1 className="text-lg font-semibold leading-relaxed mb-4 text-slate-900 dark:text-white">
                        {currentQuestion.text}
                    </h1>
                    {currentQuestion.imageUrl && !imageError && (
                        <img
                            src={currentQuestion.imageUrl}
                            className="w-full h-auto rounded-lg my-4 shadow-sm border border-slate-200 dark:border-slate-800"
                            alt="Ilustração da questão"
                            onError={handleImageError}
                        />
                    )}
                    {currentQuestion.imageUrl2 && (
                        <img
                            src={currentQuestion.imageUrl2}
                            className="w-full h-auto rounded-lg my-4 shadow-sm border border-slate-200 dark:border-slate-800"
                            alt="Ilustração da questão (parte 2)"
                        />
                    )}
                </div>
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button key={`${currentQuestion.id}-${index}`} onClick={() => handleAnswer(index)} className={getOptionClasses(index)} disabled={isCorrect !== null}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${selectedOption === index ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>{String.fromCharCode(65 + index)}</div>
                            <span className="text-sm font-medium flex-1 text-slate-800 dark:text-slate-50">{option}</span>
                            {selectedOption === index && isCorrect && <CheckCircleIcon className="text-green-500" />}
                            {selectedOption === index && !isCorrect && <CloseIcon className="text-red-500" />}
                        </button>
                    ))}
                </div>
                {/* Barra de navegação fixa no rodapé */}
                {!showTutor && (
                    <div className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-50 -mx-6 mt-4">
                        <button
                            onClick={handlePreviousQuestion}
                            disabled={questionIndex === 0}
                            className={`flex items-center gap-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${questionIndex === 0
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-primary hover:bg-primary/10 active:bg-primary/20'
                                }`}
                        >
                            <span className="material-icons-round text-lg">chevron_left</span>
                            Anterior
                        </button>
                        <span className="text-xs font-bold text-slate-400">{questionIndex + 1} / {activeQuestions.length}</span>
                        <button
                            onClick={handleNextQuestion}
                            disabled={isCorrect === null && !answers[questionIndex]}
                            className={`flex items-center gap-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${isCorrect === null && !answers[questionIndex]
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-primary hover:bg-primary/10 active:bg-primary/20'
                                }`}
                        >
                            {questionIndex === activeQuestions.length - 1 ? 'Finalizar' : 'Próxima'}
                            <span className="material-icons-round text-lg">chevron_right</span>
                        </button>
                    </div>
                )}
            </main>
            {showTutor && <AiTutorModal explanation={aiExplanation} onClose={handleNextQuestion} isLoading={isLoadingExplanation} />}
        </div>
    );
};

export default PastExamArena;