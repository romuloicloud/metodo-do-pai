import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { mockUser } from '../services/mockData';
import { getDashboardStats, DashboardStats } from '../services/statsService';
import { supabase } from '../services/supabaseClient';
import { AlertIcon } from './icons';
import DashboardSummary from './DashboardSummary';
import AvatarUpload from './AvatarUpload';

const SubjectStatCard: React.FC<{
    subject: string;
    accuracy: number;
    correct: number;
    total: number;
    icon: string;
    color: string;
}> = ({ subject, accuracy, correct, total, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
            <span className={`material-icons-round text-2xl ${color}`}>{icon}</span>
            <h3 className="font-bold text-slate-800 dark:text-white">{subject}</h3>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
            <div className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${accuracy}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{correct} / {total} acertos</span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{accuracy}%</span>
        </div>
    </div>
);

const Dashboard: React.FC<{ setView?: (view: View) => void }> = ({ setView }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [userName, setUserName] = useState<string>('Aluno');
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserName(user.user_metadata.full_name || 'Aluno');
                setUserId(user.id);
                setAvatarUrl(user.user_metadata.avatar_url || null);
                const userStats = await getDashboardStats(user.id);
                setStats(userStats);

                if (userStats) {
                    const { portuguesTotal, matematicaTotal } = userStats;
                    if (portuguesTotal > 0 && matematicaTotal > 0) {
                        if (portuguesTotal > matematicaTotal * 1.3) {
                            setAlertMessage('⚠️ Ei! Português está indo bem, mas não esqueça de praticar Matemática hoje!');
                        } else if (matematicaTotal > portuguesTotal * 1.3) {
                            setAlertMessage('⚠️ Ei! Matemática está indo bem, mas não esqueça de praticar Português hoje!');
                        } else {
                            setAlertMessage(null);
                        }
                    }
                }
            }
        };
        fetchData();
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-full">
            <header className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="material-icons-round text-2xl">analytics</span>
                    <h1 className="text-lg font-semibold tracking-tight">Painel de Insights</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full relative">
                        <span className="material-icons-round">notifications</span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-primary"></span>
                    </button>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        title="Sair"
                    >
                        <span className="material-icons-round">logout</span>
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-5 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4 px-2">
                    <AvatarUpload
                        userId={userId}
                        currentAvatarUrl={avatarUrl}
                        onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
                    />
                    <div>
                        <h2 className="text-xl font-bold text-primary dark:text-blue-400">{userName}</h2>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{mockUser.targetSchool}</span>
                            <span className="text-xs font-bold bg-accent-gold/10 text-accent-gold px-2 py-0.5 rounded-full">FAETEC</span>
                        </div>
                    </div>
                </div>

                {alertMessage && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-lg flex items-start gap-3">
                        <AlertIcon className="text-amber-500 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">{alertMessage}</p>
                    </div>
                )}

                <DashboardSummary stats={stats} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SubjectStatCard
                        subject="Português"
                        accuracy={stats?.portuguesAccuracy ?? 0}
                        correct={stats?.portuguesCorrect ?? 0}
                        total={stats?.portuguesTotal ?? 0}
                        icon="menu_book"
                        color="text-primary"
                    />
                    <SubjectStatCard
                        subject="Matemática"
                        accuracy={stats?.matematicaAccuracy ?? 0}
                        correct={stats?.matematicaCorrect ?? 0}
                        total={stats?.matematicaTotal ?? 0}
                        icon="functions"
                        color="text-amber-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800 dark:text-white">Assuntos Críticos</h3>
                        {stats && stats.criticalTopics.length > 0 &&
                            <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">{stats.criticalTopics.length} ITENS DE ATENÇÃO</span>
                        }
                    </div>
                    {stats && stats.criticalTopics.length > 0 ? (
                        <div className="space-y-3">
                            {stats.criticalTopics.map(topic => (
                                <button key={topic.topic} onClick={() => setView?.('STUDY_CENTER')} className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                        <AlertIcon className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{topic.topic}</h4>
                                        <p className="text-xs text-slate-500">{topic.mastery}% de acerto em {topic.questionsAttempted} questões</p>
                                    </div>
                                    <span className="material-icons-round text-slate-400">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-slate-500 py-4">Nenhum ponto crítico detectado. Continue assim!</p>
                    )}
                </div>

                <div className="bg-gradient-to-br from-primary to-blue-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-icons-round text-6xl">auto_awesome</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className="material-icons-round text-accent-gold">auto_awesome</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Insight Estratégico AI</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4 relative z-10 text-blue-50">
                        "Notamos uma dificuldade em <strong>Cálculo de Áreas</strong>. Lucas tende a errar na conversão de unidades. Sugerimos revisar as tabelas de medidas na segunda-feira."
                    </p>
                </div>

            </main>
            <div className="h-24"></div>
        </div>
    );
};

export default Dashboard;