
import React from 'react';
import { DashboardStats } from '../services/statsService';

interface DashboardSummaryProps {
    stats: DashboardStats | null;
}

const StatBox: React.FC<{ label: string; value: string | number; subtext?: string; icon: string; color: string }> = ({ label, value, subtext, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${color.replace('text-', 'bg-').replace('500', '100').replace('600', '100')} dark:bg-opacity-20 flex items-center justify-center`}>
            <span className={`material-icons-round ${color} text-2xl`}>{icon}</span>
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h4>
            {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
        </div>
    </div>
);

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ stats }) => {
    const totalQuestions = (stats?.portuguesTotal || 0) + (stats?.matematicaTotal || 0);
    const mathAcc = stats?.matematicaAccuracy || 0;
    const portAcc = stats?.portuguesAccuracy || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox
                label="Total de Questões"
                value={totalQuestions}
                subtext="Respondidas até agora"
                icon="quiz"
                color="text-blue-600"
            />
            <StatBox
                label="Matemática"
                value={`${mathAcc}%`}
                subtext={`${stats?.matematicaCorrect || 0} de ${stats?.matematicaTotal || 0} acertos`}
                icon="functions"
                color="text-amber-500"
            />
            <StatBox
                label="Português"
                value={`${portAcc}%`}
                subtext={`${stats?.portuguesCorrect || 0} de ${stats?.portuguesTotal || 0} acertos`}
                icon="menu_book"
                color="text-emerald-500"
            />
        </div>
    );
};

export default DashboardSummary;
