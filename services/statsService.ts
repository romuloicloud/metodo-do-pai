import { supabase } from './supabaseClient';
import { TopicProgress, RankEntry } from '../types';
import { mockRanking } from './mockData';

/**
 * Interface para os dados consolidados do painel por matéria.
 */
export interface DashboardStats {
    portuguesTotal: number;
    portuguesCorrect: number;
    portuguesAccuracy: number;
    matematicaTotal: number;
    matematicaCorrect: number;
    matematicaAccuracy: number;
    criticalTopics: TopicProgress[];
}

/**
 * Normaliza o nome da matéria para o padrão do stats
 */
const normalizeSubject = (subject: string): string => {
    if (subject === 'Língua Portuguesa' || subject === 'Português') return 'Português';
    if (subject === 'Matemática') return 'Matemática';
    return subject;
};

/**
 * Busca as estatísticas de um aluno no Supabase para exibir no Dashboard.
 */
export const getDashboardStats = async (userId: string): Promise<DashboardStats> => {
    // 1. Buscar stats gerais por matéria
    const { data: subjectData, error: subjectError } = await supabase
        .from('student_stats')
        .select('subject, score, total_questions')
        .eq('user_id', userId);

    if (subjectError) {
        console.error('Error fetching student stats:', subjectError);
    }

    let pCorrect = 0, pTotal = 0, mCorrect = 0, mTotal = 0;

    if (subjectData) {
        for (const row of subjectData) {
            if (row.subject === 'Português') {
                pCorrect = row.score ?? 0;
                pTotal = row.total_questions ?? 0;
            } else if (row.subject === 'Matemática') {
                mCorrect = row.score ?? 0;
                mTotal = row.total_questions ?? 0;
            }
        }
    }

    // 2. Buscar stats por tópico para identificar assuntos críticos
    const { data: topicData, error: topicError } = await supabase
        .from('topic_stats')
        .select('subject, topic, score, total_questions')
        .eq('user_id', userId);

    if (topicError) {
        console.error('Error fetching topic stats:', topicError);
    }

    const criticalTopics: TopicProgress[] = [];

    if (topicData) {
        for (const row of topicData) {
            const total = row.total_questions ?? 0;
            const score = row.score ?? 0;
            if (total === 0) continue;

            const mastery = Math.round((score / total) * 100);
            const subject = row.subject as 'Matemática' | 'Português';

            // Tópico é crítico se acerto < 50%
            if (mastery < 50) {
                criticalTopics.push({
                    topic: row.topic,
                    subject,
                    mastery,
                    questionsAttempted: total,
                    status: mastery < 25 ? 'critical' : 'warning',
                });
            }
        }

        // Ordenar: os mais críticos primeiro
        criticalTopics.sort((a, b) => a.mastery - b.mastery);
    }

    return {
        portuguesCorrect: pCorrect,
        portuguesTotal: pTotal,
        portuguesAccuracy: pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0,
        matematicaCorrect: mCorrect,
        matematicaTotal: mTotal,
        matematicaAccuracy: mTotal > 0 ? Math.round((mCorrect / mTotal) * 100) : 0,
        criticalTopics,
    };
};

/**
 * Salva o resultado de uma questão usando RPCs atômicas (sem race conditions).
 */
export const saveResult = async (userId: string, subject: string, topic: string, isCorrect: boolean, _timeTaken: number) => {
    const normalizedSubject = normalizeSubject(subject);
    if (normalizedSubject !== 'Português' && normalizedSubject !== 'Matemática') return;

    // Chamar RPCs atômicas em paralelo
    const [subjectResult, topicResult] = await Promise.all([
        supabase.rpc('increment_student_stats', {
            p_user_id: userId,
            p_subject: normalizedSubject,
            p_is_correct: isCorrect,
        }),
        supabase.rpc('increment_topic_stats', {
            p_user_id: userId,
            p_subject: normalizedSubject,
            p_topic: topic,
            p_is_correct: isCorrect,
        }),
    ]);

    if (subjectResult.error) {
        console.error('Error saving subject stats:', subjectResult.error);
    }
    if (topicResult.error) {
        console.error('Error saving topic stats:', topicResult.error);
    }
};

/**
 * Retorna os dados do ranking (atualmente mockado).
 */
export const getRankingData = (): RankEntry[] => {
    return mockRanking;
};