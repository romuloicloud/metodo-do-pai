import React, { useState, useEffect, useRef } from 'react';
import { generateTheoryLesson } from '../services/geminiService';
import { pastExamsData } from '../services/pastExamsData';
import { TheoryLesson, Exam, View } from '../types';
import { syllabus } from '../services/syllabusData';
import { supabase } from '../services/supabaseClient';

const SimpleTutorModal: React.FC<{ explanation: string; onClose: () => void }> = ({ explanation, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col justify-end fixed">
            <div className="flex flex-col items-center mb-[-24px] z-50">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(22,75,182,0.5)] border-4 border-primary overflow-hidden">
                    <img alt="Avatar do Método do Pai" className="w-full h-full object-cover" src="/assets/avatar-pai.jpg" />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl px-6 pt-10 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col max-h-[80%] animate-slide-up">
                <p className="text-center font-serif italic text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-4">Assinatura do Pai</p>
                <div className="text-center mb-6 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Opa! Vamos corrigir isso 💡</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Entenda o pulo do gato:</p>
                </div>
                <div className="space-y-4 mb-6 overflow-y-auto pr-2 flex-1">
                    <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{explanation}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shrink-0 transition-colors">
                    <span>Entendi, tentar próxima!</span>
                </button>
            </div>
        </div>
    );
};

const TheoryModal: React.FC<{ htmlContent: string; title: string; onClose: () => void; onStartPractice: () => void }> = ({ htmlContent, title, onClose, onStartPractice }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
                <header className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Material Teórico</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-icons-round text-slate-500">close</span>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
                <footer className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Fechar
                    </button>
                    <button onClick={onStartPractice} className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-colors flex items-center justify-center gap-2">
                        <span className="material-icons-round">fitness_center</span>
                        Ir para o Treino
                    </button>
                </footer>
            </div>
        </div>
    );
};

const LessonView: React.FC<{ lesson: TheoryLesson; onBack: () => void; setView: (view: View) => void; }> = ({ lesson, onBack, setView }) => {
    const [answers, setAnswers] = useState<(number | null)[]>(Array(lesson.exercises.length).fill(null));
    const [showExplanation, setShowExplanation] = useState<string | null>(null);

    const handleAnswer = (exerciseIndex: number, optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[exerciseIndex] = optionIndex;
        setAnswers(newAnswers);

        const currentExercise = lesson.exercises[exerciseIndex];
        const isCorrect = optionIndex === currentExercise.correctOptionIndex;

        if (!isCorrect && currentExercise.explanation) {
            setShowExplanation(currentExercise.explanation);
        }
    };

    return (
        <div className="h-full flex flex-col relative">
            <header className="p-5 pb-0 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-primary dark:text-blue-400 mb-4">
                    <span className="material-icons-round">arrow_back</span>
                    Voltar para os Tópicos
                </button>
                <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">{lesson.topic}</h2>
                <p className="text-sm text-slate-500 mb-6">Hora de praticar o que aprendeu!</p>
            </header>

            <main className="flex-1 overflow-y-auto p-5 pt-6 pb-40">
                {/* Theory Removed from here, now displayed in Modal before */}

                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Questões de Fixação</h3>
                <div className="space-y-6">
                    {lesson.exercises.map((ex, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-100">{i + 1}. {ex.question}</p>
                            <div className="space-y-2">
                                {ex.options.map((opt, j) => {
                                    const isSelected = answers[i] === j;
                                    const isCorrect = ex.correctOptionIndex === j;
                                    const showResult = answers[i] !== null; // Only show colors after answering

                                    let classes = 'w-full text-left text-sm p-3 border rounded-md transition-all ';

                                    if (showResult) {
                                        if (isSelected) {
                                            classes += isCorrect
                                                ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-500 text-green-900 dark:text-green-100 font-medium'
                                                : 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-500 text-red-900 dark:text-red-100 font-medium';
                                        } else if (isCorrect) {
                                            classes += 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
                                        } else {
                                            classes += 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60';
                                        }
                                    } else {
                                        classes += 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100';
                                    }

                                    return (
                                        <button key={j} onClick={() => !showResult && handleAnswer(i, j)} disabled={showResult} className={classes}>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? (isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                    {String.fromCharCode(65 + j)}
                                                </span>
                                                {opt}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {answers.every(a => a !== null) && (
                    <div className="mt-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 text-center shadow-lg animate-fade-in-up">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Treino Concluído!</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Bora para o próximo nível?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setView('PRACTICE')}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round">quiz</span>
                                Ir para a Arena (Simulados)
                            </button>
                            <button
                                onClick={onBack}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round">school</span>
                                Outros Tópicos
                            </button>
                        </div>
                    </div>
                )}
            </main>
            {showExplanation && (
                <SimpleTutorModal explanation={showExplanation} onClose={() => setShowExplanation(null)} />
            )}
        </div>
    );
};

interface StudyCenterProps {
    onSelectExam: (exam: Exam) => void;
    setView: (view: View) => void;
}

const ExamDropdown: React.FC<{ onSelectExam: (exam: Exam) => void }> = ({ onSelectExam }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (exam: Exam) => {
        onSelectExam(exam);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-icons-round text-primary">description</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Selecionar Edição da Prova</h4>
                        <p className="text-xs text-slate-500">Escolha um ano para começar</p>
                    </div>
                </div>
                <span className={`material-icons-round text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    <ul className="p-2 pb-10">
                        {pastExamsData.map(exam => (
                            <li key={exam.id}>
                                <button onClick={() => handleSelect(exam)} className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{exam.name}</span>
                                    {exam.id === 'cp2-2017' && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded uppercase">Novo</span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};



const StudyCenter: React.FC<StudyCenterProps> = ({ onSelectExam, setView }) => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [lesson, setLesson] = useState<TheoryLesson | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSubject, setLoadingSubject] = useState<keyof typeof syllabus | null>(null);

    // New States
    const [theoryHtml, setTheoryHtml] = useState<string | null>(null);
    const [isTheoryModalOpen, setIsTheoryModalOpen] = useState(false);
    const [preloadedExercises, setPreloadedExercises] = useState<any[]>([]);

    const handleTopicSelect = async (topic: string, subject: keyof typeof syllabus) => {
        setSelectedTopic(topic);
        setIsLoading(true);
        setLoadingSubject(subject);

        // 1. Try to fetch content from Supabase
        try {
            const { data: theoryData, error: theoryError } = await supabase
                .from('teoria')
                .select('id, conteudo_html')
                .eq('materia', subject)
                .eq('topico', topic)
                .maybeSingle();

            if (theoryData) {
                // Fetch associated questions
                const { data: questionsData } = await supabase
                    .from('treinamento')
                    .select('*')
                    .eq('teoria_id', theoryData.id);

                setTheoryHtml(theoryData.conteudo_html);

                if (questionsData) {
                    const mappedExercises = questionsData.map((q: any) => ({
                        question: q.pergunta,
                        options: q.alternativas,
                        correctOptionIndex: q.correta,
                        explanation: q.explicacao
                    }));
                    setPreloadedExercises(mappedExercises);
                }

                setIsTheoryModalOpen(true);
                setIsLoading(false);
                setLoadingSubject(null);
                return;
            }

        } catch (error) {
            console.error("Error fetching content from Supabase:", error);
            // Fallback to AI generation below
        }

        // 2. Fallback: Generate via Gemini AI (Old Logic)
        const result = await generateTheoryLesson(topic);


        setLesson(result);
        setIsLoading(false);
        setLoadingSubject(null);
    };

    const startPracticeFromModal = () => {
        setIsTheoryModalOpen(false);
        setLesson({
            topic: selectedTopic || 'Treinamento',
            explanation: '', // Not used anymore in LessonView as we have the modal
            exercises: preloadedExercises
        });
    };

    if (isLoading) {
        const title = loadingSubject === 'Língua Portuguesa'
            ? 'O Pai está revisando a gramática... 📚'
            : 'O Pai está resumindo a matéria... ⚡';
        const subtitle = loadingSubject === 'Língua Portuguesa'
            ? 'Aguarde, a IA está preparando uma aula de português para você!'
            : 'Aguarde, a IA está montando um conteúdo de matemática exclusivo!';

        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <h2 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
                <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
        );
    }

    if (lesson) {
        return <LessonView lesson={lesson} onBack={() => setLesson(null)} setView={setView} />;
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-full pb-24 relative">
            {isTheoryModalOpen && theoryHtml && selectedTopic && (
                <TheoryModal
                    htmlContent={theoryHtml}
                    title={selectedTopic}
                    onClose={() => setIsTheoryModalOpen(false)}
                    onStartPractice={startPracticeFromModal}
                />
            )}
            <header className="bg-primary text-white px-6 py-4 flex items-center gap-3 shadow-lg">
                <span className="material-icons-round text-2xl">school</span>
                <h1 className="text-lg font-semibold tracking-tight">Centro de Estudos</h1>
            </header>
            <main className="p-5 space-y-8 max-w-4xl mx-auto w-full">
                <section>
                    <h2 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest mb-3">Aprender Teoria</h2>
                    <div className="space-y-4">
                        {Object.entries(syllabus).map(([subject, topics]) => (
                            <div key={subject} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-primary dark:text-blue-400 mb-3">{subject}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {topics.map(topic => (
                                        <button
                                            key={topic}
                                            onClick={() => handleTopicSelect(topic, subject as keyof typeof syllabus)}
                                            className="text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 transition-colors"
                                        >
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{topic}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest mb-3">Provas Anteriores</h2>
                    <ExamDropdown onSelectExam={onSelectExam} />
                </section>

            </main>
        </div>
    );
};

export default StudyCenter;