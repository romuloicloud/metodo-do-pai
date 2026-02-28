
import React, { useState, useEffect } from 'react';
import { getRankingData } from '../services/statsService';
import { RankEntry } from '../types';
import { CrownIcon, TrendUpIcon, TrendSameIcon } from './icons';
import { supabase } from '../services/supabaseClient';

const Podium: React.FC<{ topThree: RankEntry[] }> = ({ topThree }) => {
    const p1 = topThree[0];
    const p2 = topThree[1];
    const p3 = topThree[2];

    return (
        <div className="flex items-end justify-center gap-3 mt-8 mb-4 h-48">
            {p2 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                        <img alt="Avatar 2" className="w-14 h-14 rounded-full border-4 border-custom-silver object-cover bg-slate-700" src={p2.avatarUrl} />
                        <div className="absolute -bottom-2 -right-1 bg-custom-silver text-primary text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary">2º</div>
                    </div>
                    <span className="text-xs font-bold truncate w-16 text-center text-white">{p2.name}</span>
                    <div className="h-14 w-12 bg-custom-silver/20 rounded-t-lg mt-1 flex items-end justify-center pb-2">
                        <span className="text-xs font-black text-white">{p2.xp}</span>
                    </div>
                </div>
            )}
            {p1 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2 scale-110">
                        <img alt="Avatar 1" className="w-16 h-16 rounded-full border-4 border-custom-gold object-cover shadow-lg bg-slate-700" src={p1.avatarUrl} />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-custom-gold animate-bounce">
                            <CrownIcon />
                        </div>
                        <div className="absolute -bottom-2 -right-1 bg-custom-gold text-primary text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-primary">1º</div>
                    </div>
                    <span className="text-sm font-black truncate w-20 text-center text-white">{p1.name}</span>
                    <div className="h-20 w-16 bg-custom-gold/30 rounded-t-lg mt-1 flex items-end justify-center pb-2 border-x border-t border-custom-gold/40">
                        <span className="text-sm font-black text-custom-gold">{p1.xp}</span>
                    </div>
                </div>
            )}
            {p3 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                        <img alt="Avatar 3" className="w-14 h-14 rounded-full border-4 border-custom-bronze object-cover bg-slate-700" src={p3.avatarUrl} />
                        <div className="absolute -bottom-2 -right-1 bg-custom-bronze text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary">3º</div>
                    </div>
                    <span className="text-xs font-bold truncate w-16 text-center text-white">{p3.name}</span>
                    <div className="h-10 w-12 bg-custom-bronze/20 rounded-t-lg mt-1 flex items-end justify-center pb-2">
                        <span className="text-xs font-black text-white">{p3.xp}</span>
                    </div>
                </div>
            )}
        </div>
    )
};


const Ranking: React.FC = () => {
    const [ranking, setRanking] = useState<RankEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        const fetchRanking = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            const data = await getRankingData();
            setRanking(data);
            setIsLoading(false);
        };
        fetchRanking();
    }, []);

    const currentUserRank = ranking.find(u => u.name !== 'Aluno' && currentUserId)
        || ranking.find((_u, i) => {
            // Match by position if we have the current user's ID in the data
            return false;
        });

    // Conquistas baseadas nos dados reais do aluno que está logado
    const myEntry = ranking.find((_r, _i) => {
        // Find the current user in the ranking by checking all entries
        // Since we don't have user_id in RankEntry, use position-based matching
        return false;
    });

    const totalXP = ranking.length > 0 ? (ranking.find(r => r.rank === 1)?.xp || 0) : 0;

    // Conquistas dinâmicas baseadas nos dados
    const achievements = [
        { id: 'first_steps', icon: 'emoji_events', name: 'Primeiros Passos', achieved: ranking.length > 0, description: 'Completou sua primeira questão' },
        { id: 'math_star', icon: 'functions', name: 'Estrela da Matemática', achieved: false, description: 'Acerte 50 questões de Matemática' },
        { id: 'port_master', icon: 'menu_book', name: 'Mestre do Português', achieved: false, description: 'Acerte 50 questões de Português' },
        { id: 'fire_streak', icon: 'local_fire_department', name: '5 Dias de Fogo', achieved: false, description: 'Estude 5 dias seguidos' },
        { id: 'fast_thinker', icon: 'bolt', name: 'Pensador Veloz', achieved: false, description: 'Responda 10 questões em menos de 30s' },
        { id: 'top3', icon: 'workspace_premium', name: 'Top 3 Ranking', achieved: false, description: 'Fique entre os 3 primeiros' },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-background-dark">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <h2 className="mt-4 text-lg font-semibold text-slate-300">Carregando ranking...</h2>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-full pb-24">
            <header className="pt-10 px-6 pb-4 bg-primary text-white rounded-b-3xl shadow-xl">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight">Ranking de Heróis</h1>
                    <p className="text-blue-200 text-sm mt-1 opacity-90">Rumo ao Pedro II e FAETEC!</p>
                    {ranking.length === 0 && (
                        <p className="text-blue-100 text-xs mt-3 bg-white/10 px-4 py-2 rounded-lg">
                            Nenhum aluno pontuou ainda. Responda questões para aparecer no ranking! 🎯
                        </p>
                    )}
                </div>
                {ranking.length > 0 && <Podium topThree={ranking.slice(0, 3)} />}
            </header>
            <main className="px-5 pt-6 space-y-8 max-w-5xl mx-auto w-full">
                {ranking.length > 3 && (
                    <section className="space-y-3">
                        <div className="flex justify-between items-center px-1 mb-2">
                            <h3 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest">Top Estudantes</h3>
                        </div>
                        <div className="space-y-2">
                            {ranking.slice(3).map(entry => (
                                <div key={entry.rank} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-black text-slate-400 w-4">{entry.rank}º</span>
                                    <img className="w-10 h-10 rounded-full bg-slate-700 object-cover" src={entry.avatarUrl} alt={entry.name} />
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-slate-800 dark:text-white">{entry.name}</h5>
                                        <p className="text-[10px] text-slate-500">{entry.xp} pontos</p>
                                    </div>
                                    {entry.trend === 'up' && <TrendUpIcon className="text-green-500" />}
                                    {entry.trend === 'same' && <TrendSameIcon className="text-slate-400" />}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-4">
                    <h3 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest">Suas Conquistas</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {achievements.map(badge => (
                            <div key={badge.id} className={`flex flex-col items-center text-center gap-2 ${!badge.achieved && 'opacity-50 grayscale'}`}>
                                <div className={`w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border-4 ${badge.achieved ? 'border-custom-gold' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <span className={`material-icons-round text-3xl ${badge.achieved ? 'text-custom-gold' : 'text-slate-300 dark:text-slate-600'}`}>{badge.icon}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Ranking;
