import { supabase } from './supabaseClient';
import { Question, DiagnosticAnswer, DiagnosticResult } from '../types';

/**
 * Verifica se o aluno já completou o diagnóstico.
 */
export const hasCompletedDiagnostic = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('diagnostic_results')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar diagnóstico:', error);
    }
    return !!data;
};

/**
 * Sorteia questões aleatórias do banco de dados para o diagnóstico.
 * 5 de Português + 5 de Matemática, embaralhadas.
 */
export const fetchDiagnosticQuestions = async (): Promise<Question[]> => {
    // Buscar questões de Português
    const { data: ptQuestions, error: ptError } = await supabase
        .from('questoes')
        .select('*')
        .ilike('subject', '%Portugu%')
        .limit(100);

    if (ptError) console.error('Erro buscando questões PT:', ptError);

    // Buscar questões de Matemática
    const { data: matQuestions, error: matError } = await supabase
        .from('questoes')
        .select('*')
        .ilike('subject', '%Matem%')
        .limit(100);

    if (matError) console.error('Erro buscando questões MAT:', matError);

    // Filtrar questões que referenciam textos mas não têm o conteúdo real
    // base_text precisa ter 200+ chars para ser considerado conteúdo real (e não só título)
    const hasValidText = (q: any): boolean => {
        const text = (q.text || '').toLowerCase();
        const needsBaseText = text.includes('texto i') || text.includes('texto ii') ||
            text.includes('texto iii') || text.includes('poema') || text.includes('trecho') ||
            text.includes('leia o') || text.includes('leia a') ||
            text.includes('charge') || text.includes('tirinha') || text.includes('quadrinho');
        // Se a questão referencia um texto, só usar se tiver base_text com conteúdo real (200+ chars)
        if (needsBaseText && (!q.base_text || q.base_text.length < 200)) return false;
        return true;
    };

    // Embaralhar e pegar 5 de cada (só questões com textos completos)
    const shuffled = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
    const validPT = (ptQuestions || []).filter(hasValidText);
    const validMAT = (matQuestions || []).filter(hasValidText);
    const selectedPT = shuffled(validPT).slice(0, 5);
    const selectedMAT = shuffled(validMAT).slice(0, 5);

    // Mapear para o formato Question
    const mapToQuestion = (q: any): Question => ({
        id: q.id,
        topic: q.topic || 'Geral',
        subject: q.subject?.includes('Portugu') ? 'Português' : 'Matemática',
        text: q.text,
        baseText: q.base_text || undefined,
        imageUrl: q.image_url || undefined,
        imageUrl2: q.image_url_2 || undefined,
        options: q.options,
        correctOptionIndex: q.correct_option_index,
    });

    // Combinar e embaralhar a ordem final
    const all = shuffled([...selectedPT, ...selectedMAT]);
    return all.map(mapToQuestion);
};

/**
 * Analisa as respostas e identifica tópicos fortes/fracos.
 */
export const analyzeDiagnosticResults = (answers: DiagnosticAnswer[]): DiagnosticResult => {
    const scoreTotal = answers.filter(a => a.isCorrect).length;
    const scorePortugues = answers.filter(a => a.subject.includes('Portugu') && a.isCorrect).length;
    const scoreMatematica = answers.filter(a => a.subject.includes('Matem') && a.isCorrect).length;

    // Agrupar por tópico e calcular acerto
    const topicMap: Record<string, { correct: number; total: number }> = {};
    answers.forEach(a => {
        if (!topicMap[a.topic]) topicMap[a.topic] = { correct: 0, total: 0 };
        topicMap[a.topic].total++;
        if (a.isCorrect) topicMap[a.topic].correct++;
    });

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    Object.entries(topicMap).forEach(([topic, stats]) => {
        const accuracy = stats.correct / stats.total;
        if (accuracy < 0.5) weakTopics.push(topic);
        else strongTopics.push(topic);
    });

    return {
        scoreTotal,
        scorePortugues,
        scoreMatematica,
        weakTopics,
        strongTopics,
        answers,
    };
};

/**
 * Salva o resultado do diagnóstico no Supabase.
 */
export const saveDiagnosticResult = async (userId: string, result: DiagnosticResult): Promise<boolean> => {
    const { error } = await supabase
        .from('diagnostic_results')
        .insert({
            user_id: userId,
            score_total: result.scoreTotal,
            score_portugues: result.scorePortugues,
            score_matematica: result.scoreMatematica,
            weak_topics: result.weakTopics,
            strong_topics: result.strongTopics,
            answers: result.answers,
        });

    if (error) {
        console.error('Erro ao salvar diagnóstico:', error);
        return false;
    }
    return true;
};

/**
 * Busca o resultado do diagnóstico salvo para exibir na tela de resultado.
 */
export const getDiagnosticResult = async (userId: string): Promise<DiagnosticResult | null> => {
    const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    return {
        scoreTotal: data.score_total,
        scorePortugues: data.score_portugues,
        scoreMatematica: data.score_matematica,
        weakTopics: data.weak_topics,
        strongTopics: data.strong_topics,
        answers: data.answers as DiagnosticAnswer[],
    };
};
