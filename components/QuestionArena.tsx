import React, { useState, useEffect, useCallback } from 'react';
import { Question, AiExplanation } from '../types';
import { getAIExplanation } from '../services/geminiService';
import { saveResult } from '../services/statsService';
import { supabase } from '../services/supabaseClient';
import { SmartToyIcon, CheckCircleIcon, CloseIcon } from './icons';

const AiTutorModal: React.FC<{ explanation: AiExplanation | null; onClose: () => void; isLoading: boolean }> = ({ explanation, onClose, isLoading }) => {
    if (!explanation && !isLoading) return null;

    return (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col justify-end">
            <div className="flex flex-col items-center mb-[-24px] z-30">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(22,75,182,0.5)] border-4 border-primary overflow-hidden">
                    <img alt="Avatar do Método do Pai" className="w-full h-full object-cover" src="/assets/avatar-pai.jpg" />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl px-6 pt-10 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col max-h-[80%]">
                <p className="text-center font-serif italic text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Assinatura do Pai</p>
                <div className="text-center mb-6 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">O Método do Pai</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Vamos corrigir juntos! 🚀</p>
                </div>
                {isLoading ? (
                    <div className="flex flex-col items-center py-8">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">O Pai está pensando...</p>
                    </div>
                ) : explanation ? (
                    <div className="space-y-4 mb-4 overflow-y-auto pr-2 flex-1">
                        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{explanation.attentionDetail}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{explanation.keyInsight}"</p>
                        </div>
                        {explanation.analogy && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold mb-1">🎯 Pense assim:</p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{explanation.analogy.text}</p>
                            </div>
                        )}
                    </div>
                ) : null}
                <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shrink-0 transition-colors">
                    <span>Entendi o método!</span>
                </button>
            </div>
        </div>
    );
};

const SubjectSelector: React.FC<{ onSelect: (subject: 'Português' | 'Matemática') => void }> = ({ onSelect }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 pb-28">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">O que vamos treinar agora?</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Escolha uma matéria para focar seus estudos e receber questões direcionadas.</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button
                onClick={() => onSelect('Português')}
                className="w-full p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all"
            >
                <span className="material-icons-round text-4xl text-primary mb-2">menu_book</span>
                <span className="font-bold text-lg text-slate-800 dark:text-white">Português</span>
            </button>
            <button
                onClick={() => onSelect('Matemática')}
                className="w-full p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-500/5 transition-all"
            >
                <span className="material-icons-round text-4xl text-amber-500 mb-2">functions</span>
                <span className="font-bold text-lg text-slate-800 dark:text-white">Matemática</span>
            </button>
        </div>
    </div>
);


const QuestionArena: React.FC = () => {
    const [selectedSubject, setSelectedSubject] = useState<'Português' | 'Matemática' | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showTutor, setShowTutor] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
    const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
    const [imageError, setImageError] = useState(false);

    /**
     * Busca questões do banco Supabase (questoes) com randomização.
     * Evita repetição usando os IDs já respondidos.
     */
    const fetchQuestionsFromDB = useCallback(async (subject: 'Português' | 'Matemática') => {
        setIsLoadingQuestion(true);
        setError(null);

        const subjectFilter = subject === 'Português' ? '%Portugu%' : '%Matem%';

        const { data, error: dbError } = await supabase
            .from('questoes')
            .select('*')
            .ilike('subject', subjectFilter)
            .limit(200);

        if (dbError) {
            console.error('Erro buscando questões:', dbError);
            setError('Erro ao buscar questões. Tente novamente.');
            setIsLoadingQuestion(false);
            return;
        }

        if (!data || data.length === 0) {
            setError(`Nenhuma questão de ${subject} disponível no banco de dados.`);
            setIsLoadingQuestion(false);
            return;
        }

        // Filtrar questões já respondidas e embaralhar
        const available = data.filter(q => !answeredIds.has(q.id));
        const pool = available.length > 0 ? available : data; // Se respondeu tudo, recicla

        const shuffled = pool.sort(() => Math.random() - 0.5);

        const mapped: Question[] = shuffled.map((q: any) => ({
            id: q.id,
            topic: q.topic || 'Geral',
            subject: q.subject?.includes('Portugu') ? 'Português' as const : 'Matemática' as const,
            text: q.text,
            baseText: q.base_text || undefined,
            imageUrl: q.image_url || undefined,
            options: q.options,
            correctOptionIndex: q.correct_option_index,
        }));

        setQuestions(mapped);
        setQuestionIndex(0);
        setIsLoadingQuestion(false);
    }, [answeredIds]);

    const handleAnswer = async (optionIndex: number) => {
        if (isCorrect !== null) return;

        const currentQuestion = questions[questionIndex];
        setSelectedOption(optionIndex);
        const correct = optionIndex === currentQuestion.correctOptionIndex;
        setIsCorrect(correct);

        // Marcar como respondida
        setAnsweredIds(prev => new Set(prev).add(currentQuestion.id));

        // Salvar resultado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await saveResult(user.id, currentQuestion.subject, currentQuestion.topic, correct, 0);
        }

        if (!correct) {
            setIsLoadingExplanation(true);
            setShowTutor(true);
            const explanation = await getAIExplanation(currentQuestion, currentQuestion.options[optionIndex]);
            setAiExplanation(explanation);
            setIsLoadingExplanation(false);
        }
    };

    const handleNextQuestion = () => {
        setSelectedOption(null);
        setIsCorrect(null);
        setShowTutor(false);
        setAiExplanation(null);
        setImageError(false);

        if (questionIndex + 1 < questions.length) {
            setQuestionIndex(prev => prev + 1);
        } else {
            // Recarregar novas questões embaralhadas
            fetchQuestionsFromDB(selectedSubject!);
        }
    };

    const handleSubjectSelect = (subject: 'Português' | 'Matemática') => {
        setQuestions([]);
        setQuestionIndex(0);
        setSelectedSubject(subject);
        fetchQuestionsFromDB(subject);
    };

    const handleImageError = () => { setImageError(true); };

    const getOptionClasses = (index: number) => {
        let classes = 'w-full p-4 text-left border rounded-xl transition-all flex items-center gap-4 ';
        const currentQuestion = questions[questionIndex];
        if (selectedOption === index) {
            classes += isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20';
        } else if (isCorrect !== null && index === currentQuestion.correctOptionIndex) {
            classes += 'border-green-500 bg-green-50 dark:bg-green-900/20';
        } else {
            classes += 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-800 hover:border-primary/40 focus:border-primary active:bg-primary/5';
        }
        return classes;
    };

    if (!selectedSubject) {
        return <SubjectSelector onSelect={handleSubjectSelect} />;
    }

    if (isLoadingQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <h2 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Carregando questões...</h2>
                <p className="text-sm text-slate-500">Buscando do banco de dados</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <span className="text-4xl mb-4">😕</span>
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{error}</h2>
                <button onClick={() => fetchQuestionsFromDB(selectedSubject!)}
                    className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold">
                    Tentar novamente
                </button>
                <button onClick={() => setSelectedSubject(null)}
                    className="mt-2 text-sm text-slate-500 hover:text-white">
                    ← Trocar matéria
                </button>
            </div>
        );
    }

    const currentQuestion = questions[questionIndex];
    if (!currentQuestion) { return <div className="flex items-center justify-center h-full">Carregando...</div>; }

    return (
        <div className="relative h-full flex flex-col w-full max-w-3xl mx-auto">
            <header className="px-6 py-4 flex flex-col gap-3">
                <button onClick={() => setSelectedSubject(null)} className="flex items-center gap-2 text-sm font-bold text-primary dark:text-blue-400 self-start">
                    <span className="material-icons-round">arrow_back</span>
                    Trocar Matéria
                </button>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400">QUESTÃO {questionIndex + 1} / {questions.length}</span>
                    {/* Barra de progresso */}
                    <div className="flex-1 mx-4 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">{currentQuestion.subject} • {currentQuestion.topic}</span>
                    {currentQuestion.baseText && (
                        <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-800/50 border-l-4 border-blue-600 dark:border-blue-400 rounded-lg max-h-48 overflow-y-auto italic">
                            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-grotesk">{currentQuestion.baseText}</p>
                        </div>
                    )}
                    <h1 className="text-lg font-semibold leading-relaxed mb-4 text-slate-900 dark:text-white">
                        {currentQuestion.text}
                    </h1>
                    {currentQuestion.imageUrl && !imageError && (<img src={currentQuestion.imageUrl} className="w-full h-auto rounded-lg my-4 shadow-sm border border-slate-200 dark:border-slate-800" alt="Ilustração da questão" onError={handleImageError} />)}
                </div>
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button key={`${currentQuestion.id}-${index}`} onClick={() => handleAnswer(index)} className={getOptionClasses(index)} disabled={isCorrect !== null || isLoadingQuestion}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${selectedOption === index ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>{String.fromCharCode(65 + index)}</div>
                            <span className="text-sm font-medium flex-1 text-slate-800 dark:text-slate-50">{option}</span>
                            {selectedOption === index && isCorrect && <CheckCircleIcon className="text-green-500" />}
                            {selectedOption === index && !isCorrect && isCorrect !== null && <CloseIcon className="text-red-500" />}
                        </button>
                    ))}
                </div>
                {/* Botão Próxima (acerto sem modal IA) */}
                {isCorrect === true && (
                    <div className="mt-6">
                        <button onClick={handleNextQuestion}
                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                            ✅ Acertou! Próxima →
                        </button>
                    </div>
                )}
            </main>
            {showTutor && <AiTutorModal explanation={aiExplanation} isLoading={isLoadingExplanation} onClose={handleNextQuestion} />}
        </div>
    );
};

export default QuestionArena;