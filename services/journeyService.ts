import { supabase } from './supabaseClient';
import { JourneyPhase } from '../types';

/**
 * Fases padrão da Jornada, alinhadas ao edital.
 * A ordem pode ser reorganizada com base no diagnóstico do aluno.
 */
export const DEFAULT_PHASES: Omit<JourneyPhase, 'status' | 'stars' | 'theoryDone' | 'trainingDone' | 'bossDone' | 'bestScore'>[] = [
    { phaseNumber: 1, topic: 'Interpretação de Texto', subject: 'Português' },
    { phaseNumber: 2, topic: 'Gênero Textual', subject: 'Português' },
    { phaseNumber: 3, topic: 'Foco Narrativo', subject: 'Português' },
    { phaseNumber: 4, topic: 'Semântica e Figuras de Linguagem', subject: 'Português' },
    { phaseNumber: 5, topic: 'Gramática e Coesão', subject: 'Português' },
    { phaseNumber: 6, topic: 'Frações', subject: 'Matemática' },
    { phaseNumber: 7, topic: 'Porcentagem', subject: 'Matemática' },
    { phaseNumber: 8, topic: 'Geometria e Medidas', subject: 'Matemática' },
    { phaseNumber: 9, topic: 'Álgebra e Sequências', subject: 'Matemática' },
    { phaseNumber: 10, topic: 'Gráficos e Probabilidade', subject: 'Matemática' },
];

/**
 * Data da próxima prova (configurável).
 * TODO: Tornar configurável pelo admin.
 */
const EXAM_DATE = new Date('2026-11-15');

/**
 * Calcula quantos dias faltam para a prova.
 */
export const getDaysUntilExam = (): number => {
    const now = new Date();
    const diff = EXAM_DATE.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Inicializa a jornada do aluno após o diagnóstico.
 * Fase 1 = 'current', restante = 'locked'.
 * As fases dos tópicos fracos são priorizadas (movidas para cima).
 */
export const initializeJourney = async (userId: string, weakTopics: string[]): Promise<void> => {
    // Verificar se já possui jornada
    const { data: existing } = await supabase
        .from('journey_progress')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    if (existing && existing.length > 0) {
        console.log('Jornada já inicializada para este aluno.');
        return;
    }

    // Reorganizar fases: tópicos fracos primeiro
    const sortedPhases = [...DEFAULT_PHASES].sort((a, b) => {
        const aIsWeak = weakTopics.some(wt => a.topic.toLowerCase().includes(wt.toLowerCase()));
        const bIsWeak = weakTopics.some(wt => b.topic.toLowerCase().includes(wt.toLowerCase()));
        if (aIsWeak && !bIsWeak) return -1;
        if (!aIsWeak && bIsWeak) return 1;
        return 0;
    });

    // Renumerar após sort
    const phasesToInsert = sortedPhases.map((phase, index) => ({
        user_id: userId,
        phase_number: index + 1,
        topic: phase.topic,
        subject: phase.subject,
        status: index === 0 ? 'current' : 'locked',
        stars: 0,
        theory_done: false,
        training_done: false,
        boss_done: false,
        best_score: 0,
    }));

    const { error } = await supabase
        .from('journey_progress')
        .insert(phasesToInsert);

    if (error) {
        console.error('Erro ao inicializar jornada:', error);
    }
};

/**
 * Busca todas as fases da jornada do aluno.
 */
export const getJourneyPhases = async (userId: string): Promise<JourneyPhase[]> => {
    const { data, error } = await supabase
        .from('journey_progress')
        .select('*')
        .eq('user_id', userId)
        .order('phase_number', { ascending: true });

    if (error) {
        console.error('Erro ao buscar fases:', error);
        return [];
    }

    return (data || []).map(d => ({
        phaseNumber: d.phase_number,
        topic: d.topic,
        subject: d.subject,
        status: d.status as 'locked' | 'current' | 'completed',
        stars: d.stars,
        theoryDone: d.theory_done,
        trainingDone: d.training_done,
        bossDone: d.boss_done,
        bestScore: d.best_score,
    }));
};

/**
 * Atualiza o progresso de uma fase (ex: completou teoria, treino ou boss).
 */
export const updatePhaseProgress = async (
    userId: string,
    phaseNumber: number,
    updates: Partial<{
        theoryDone: boolean;
        trainingDone: boolean;
        bossDone: boolean;
        bestScore: number;
        stars: number;
    }>
): Promise<void> => {
    const dbUpdates: any = {};
    if (updates.theoryDone !== undefined) dbUpdates.theory_done = updates.theoryDone;
    if (updates.trainingDone !== undefined) dbUpdates.training_done = updates.trainingDone;
    if (updates.bossDone !== undefined) dbUpdates.boss_done = updates.bossDone;
    if (updates.bestScore !== undefined) dbUpdates.best_score = updates.bestScore;
    if (updates.stars !== undefined) dbUpdates.stars = updates.stars;
    dbUpdates.updated_at = new Date().toISOString();

    // Se o boss foi completado, marcar fase como completed e desbloquear a próxima
    if (updates.bossDone) {
        dbUpdates.status = 'completed';

        const { error } = await supabase
            .from('journey_progress')
            .update(dbUpdates)
            .eq('user_id', userId)
            .eq('phase_number', phaseNumber);

        if (error) console.error('Erro ao atualizar fase:', error);

        // Desbloquear próxima fase
        await supabase
            .from('journey_progress')
            .update({ status: 'current', updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('phase_number', phaseNumber + 1)
            .eq('status', 'locked');
    } else {
        const { error } = await supabase
            .from('journey_progress')
            .update(dbUpdates)
            .eq('user_id', userId)
            .eq('phase_number', phaseNumber);

        if (error) console.error('Erro ao atualizar fase:', error);
    }
};

/**
 * Calcula o progresso geral da jornada (%).
 */
export const getJourneyProgress = (phases: JourneyPhase[]): number => {
    if (phases.length === 0) return 0;
    const completed = phases.filter(p => p.status === 'completed').length;
    return Math.round((completed / phases.length) * 100);
};
