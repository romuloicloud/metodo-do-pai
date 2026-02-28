
import React, { useState, useEffect } from 'react';
import { getRankingData } from '../services/statsService';
import { mockUser, mockAchievements } from '../services/mockData';
import { RankEntry } from '../types';
import { CrownIcon, TrendUpIcon, TrendSameIcon } from './icons';

const Podium: React.FC<{ topThree: RankEntry[] }> = ({ topThree }) => {
    const p1 = topThree[0];
    const p2 = topThree[1];
    const p3 = topThree[2];

    return (
        <div className="flex items-end justify-center gap-3 mt-8 mb-4 h-48">
            {p2 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                        <img alt="Avatar 2" className="w-14 h-14 rounded-full border-4 border-custom-silver object-cover" src={p2.avatarUrl} />
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
                        <img alt="Avatar 1" className="w-18 h-18 rounded-full border-4 border-custom-gold object-cover shadow-lg" src={p1.avatarUrl} />
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
                        <img alt="Avatar 3" className="w-14 h-14 rounded-full border-4 border-custom-bronze object-cover" src={p3.avatarUrl} />
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

    useEffect(() => {
        setRanking(getRankingData());
    }, []);

    const currentUserRank = ranking.find(u => u.name === mockUser.name);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-full pb-24">
            <header className="pt-10 px-6 pb-4 bg-primary text-white rounded-b-3xl shadow-xl">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight">Ranking de Heróis</h1>
                    <p className="text-blue-200 text-sm mt-1 opacity-90">Rumo ao Pedro II e FAETEC!</p>
                </div>
                <Podium topThree={ranking.slice(0, 3)} />
            </header>
            <main className="px-5 pt-6 space-y-8 max-w-5xl mx-auto w-full">
                {currentUserRank && (
                    <div className="bg-primary dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <img alt="Sua Foto" className="w-12 h-12 rounded-full object-cover border-2 border-custom-gold/50" src={currentUserRank.avatarUrl} />
                            <div>
                                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">Seu Desempenho</p>
                                <h4 className="text-white font-bold">{currentUserRank.name}</h4>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-custom-gold font-black text-xl leading-none">{currentUserRank.rank}º</p>
                            <p className="text-blue-200 text-[10px] font-medium">{currentUserRank.xp} XP</p>
                        </div>
                    </div>
                )}


                <section className="space-y-3">
                    <div className="flex justify-between items-center px-1 mb-2">
                        <h3 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest">Top Estudantes</h3>
                    </div>
                    <div className="space-y-2">
                    {ranking.slice(3).map(entry => (
                        <div key={entry.rank} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-black text-slate-400 w-4">{entry.rank}º</span>
                            <img className="w-10 h-10 rounded-full bg-slate-100 object-cover" src={entry.avatarUrl} alt={entry.name}/>
                            <div className="flex-1">
                                <h5 className="text-sm font-bold text-slate-800 dark:text-white">{entry.name}</h5>
                                <p className="text-[10px] text-slate-500">{entry.xp} pontos</p>
                            </div>
                            {entry.trend === 'up' && <TrendUpIcon className="text-green-500"/>}
                            {entry.trend === 'same' && <TrendSameIcon className="text-slate-400"/>}
                        </div>
                    ))}
                    </div>
                </section>
                
                 <section className="space-y-4">
                    <h3 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest">Suas Conquistas</h3>
                    <div className="grid grid-cols-3 gap-4">
                    {mockAchievements.map(badge => (
                        <div key={badge.id} className={`flex flex-col items-center text-center gap-2 ${!badge.achieved && 'opacity-50 grayscale'}`}>
                            <div className={`w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border-4 ${badge.achieved ? 'border-custom-gold' : 'border-slate-200'}`}>
                                <span className={`material-icons-round text-3xl ${badge.achieved ? 'text-custom-gold' : 'text-slate-300'}`}>{badge.icon}</span>
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
