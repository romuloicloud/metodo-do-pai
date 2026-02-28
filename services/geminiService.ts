import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Question, AiExplanation, TheoryLesson } from '../types';
import { mockQuestions, mockLesson, mockLessonPortugues } from './mockData';
import { supabase } from './supabaseClient';
import { syllabus } from './syllabusData';

// A chave de API é injetada pelo Vite via define no vite.config.ts
// Usamos uma inicialização segura que não crasha o app se a chave estiver ausente
let ai: any;
try {
    const apiKey = (import.meta as any).env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
} catch (e) {
    console.warn('GoogleGenAI não inicializado:', e);
}


const editalContentPlaceholder = `
CONTEÚDO PROGRAMÁTICO - COLÉGO PEDRO II / FAETEC (6º ANO)

I - LÍNGUA PORTUGUESA
1. Compreensão Textual: Textos verbais/não verbais, literários/não literários. Identificação de tema, informações explícitas e implícitas. Distinção entre fato e opinião. Inferência de sentido de palavras e expressões. Recursos de expressividade e ironia/humor.
2. Análise Linguística: Linguagem figurada. Classes de palavras e seu papel no texto. Processos de flexão e derivação. Tonicidade das palavras (sílaba tônica). Verbos (Indicativo e Subjuntivo). Pronomes (pessoais, demonstrativos e possessivos) e referencialidade.
3. Mecanismos de Coesão: Retomada pronominal, substituição lexical (hiperônimos/hipônimos) e conectivos. Pontuação e concordância nominal/verbal.

II - MATEMÁTICA
1. Números: Naturais (leitura, escrita, ordenação e as 4 operações). Racionais (frações, decimais finitos e reta numérica). Equivalência, comparação e ordenação. Operações com decimais e frações (incluindo divisão por natural). Porcentagem e contagem.
2. Álgebra: Termo desconhecido, propriedades da igualdade e equivalência. Partes proporcionais. Padrões e sequências.
3. Geometria: Figuras planas (características e ângulos). Coordenadas cartesianas (1º quadrante). Figuras poligonais em malhas (ampliação/redução). Figuras espaciais (características e planificações).
4. Grandezas e Medidas: Comprimento, área, massa, tempo, temperatura e capacidade. Perímetro e área de polígonos. Volume de cubos.
5. Probabilidade e Estatística: Experimentos aleatórios, espaço amostral e cálculo de chances. Leitura e interpretação de tabelas e gráficos.
`;

const subtopics = {
    'LÍNGUA PORTUGUESA': [
        'Compreensão de Crônicas',
        'Interpretação de Notícias',
        'Análise de Poemas',
        'Leitura de Tirinhas',
        'Figuras de Linguagem',
        'Classes de Palavras',
        'Uso de Conjunções e Conectivos',
        'Regras de Pontuação',
        'Concordância Nominal e Verbal',
    ],
    'MATEMÁTICA': [
        'Operações com Números Naturais',
        'Soma e Subtração de Frações',
        'Multiplicação e Divisão de Frações',
        'Cálculos com Números Decimais',
        'Porcentagem e Proporcionalidade',
        'Resolução de Expressões (Álgebra)',
        'Padrões e Sequências Lógicas',
        'Perímetro e Área de Figuras Planas',
        'Volume de Sólidos Geométricos',
        'Coordenadas Cartesianas',
        'Leitura de Tabelas e Gráficos',
        'Cálculo de Probabilidade Simples',
    ]
};

const difficulties = [
    'Fácil (nível de dificuldade similar à prova de 2017)',
    'Médio (nível de dificuldade similar à prova de 2022)',
    'Desafio (nível de dificuldade similar à prova de 2025)',
];

const portugueseTextTypes = ['uma crônica curta', 'uma notícia breve', 'um poema simples', 'uma tirinha'];


export const getAIExplanation = async (question: Question, incorrectAnswer: string): Promise<AiExplanation | null> => {
    const prompt = `
    Você é um tutor de IA amigável e encorajador chamado 'Método do Pai'. Sua missão é explicar conceitos difíceis de forma muito simples para uma criança de 11 anos. Use analogias e exemplos do dia a dia.

    ${question.baseText ? `**Texto Base da Questão:**\n---\n${question.baseText}\n---\n` : ''}

    A pergunta era: "${question.text}"
    As opções eram: ${question.options.join(', ')}
    A resposta correta era: "${question.options[question.correctOptionIndex]}"
    O aluno respondeu incorretamente: "${incorrectAnswer}"

    Explique por que a resposta do aluno está errada e por que a resposta correta está certa. Foque em explicar o conceito por trás da resposta correta.
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, sem markdown ou qualquer outro texto.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attentionDetail: { type: Type.STRING },
                        keyInsight: { type: Type.STRING },
                        analogy: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            }
                        },
                        quickChallenge: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                correctAnswer: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AiExplanation;
        }
        return null;

    } catch (error) {
        console.error("Error fetching AI explanation:", error);
        // Fallback explanation
        return {
            attentionDetail: "Parece que você somou os números de baixo (denominadores). Lembre-se, na soma de frações com o mesmo denominador, ele não muda!",
            keyInsight: "O número de baixo só nos diz em quantos pedaços a 'pizza' foi cortada. A gente só soma os pedaços que pegamos (os números de cima).",
            analogy: {
                text: "Se você tem 1 fatia de uma pizza de 4, e pega mais 2 fatias... a pizza ainda é dividida em 4!",
                imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhYu7VH7f7W8USj4pFX4pLR2nVtziNfCyZdv7MHFFfLPPD--Kruyipah_SCIwczzZtK4u7CJYRU0XUb8bIS4798Iop5dkyhd44mTvidPv-EhBbCy53dZEI-zdYsxHChj_goDDIB_arjzuEm1t1AJG_Z9WwSdM0hCD39JAyBoINjtZEmU19a_jZDWGVKzqEYoSQLu7fFKMu5ZppUbrh3Yd8WH6nchn7LnH7Cz3YyxPwGRuBXCeg5JZIQ1YB73bmkgcK4QDCBMLnCOo"
            },
            quickChallenge: {
                question: "Então, quanto é 1/5 + 3/5?",
                correctAnswer: "4/5"
            }
        };
    }
};

export const generateQuestionFromEdital = async (subject: 'LÍNGUA PORTUGUESA' | 'MATEMÁTICA'): Promise<Question | null> => {
    const randomSubtopic = subtopics[subject][Math.floor(Math.random() * subtopics[subject].length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    let portugueseInstruction = "";
    if (subject === 'LÍNGUA PORTUGUESA' && randomSubtopic.toLowerCase().includes('interpretação') || randomSubtopic.toLowerCase().includes('crônica') || randomSubtopic.toLowerCase().includes('notícia') || randomSubtopic.toLowerCase().includes('poema') || randomSubtopic.toLowerCase().includes('tirinhas')) {
        const randomTextType = portugueseTextTypes[Math.floor(Math.random() * portugueseTextTypes.length)];
        portugueseInstruction = `Como o subtópico envolve leitura, é OBRIGATÓRIO que você crie um 'baseText' original no formato de ${randomTextType}. O texto deve ser curto, inédito e adequado para uma criança de 11 anos. A pergunta deve ser sobre este texto.`;
    }

    const prompt = `
    Você é um assistente de criação de conteúdo educacional especialista no concurso do Colégio Pedro II. Sua tarefa é criar uma questão de múltipla escolha para uma criança de 11 anos, baseada *estritamente* no conteúdo do edital fornecido.
    Conteúdo do Edital:
    ---
    ${editalContentPlaceholder}
    ---
    Instruções:
    1. Matéria: '${subject}'.
    2. Tópico Específico: '${randomSubtopic}'.
    3. Nível de Dificuldade: '${randomDifficulty}'.
    4. Instrução de Conteúdo: ${portugueseInstruction}
    5. Formato: 4 opções de resposta (A, B, C, D), apenas uma correta.
    6. Saída: Apenas o objeto JSON puro.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        baseText: { type: Type.STRING },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctOptionIndex: { type: Type.INTEGER },
                    },
                    required: ['subject', 'topic', 'text', 'options', 'correctOptionIndex']
                },
                seed: Math.floor(Math.random() * 1000000)
            }
        });

        if (response.text) {
            const generatedQuestion = JSON.parse(response.text) as Omit<Question, 'id'>;
            // Ensure subject is correctly typed
            const typedSubject = subject === 'LÍNGUA PORTUGUESA' ? 'Português' : 'Matemática';
            return { ...generatedQuestion, subject: typedSubject, id: `gen-${Date.now()}` };
        }
        throw new Error("Empty response from AI.");

    } catch (error) {
        console.error("Error generating question from edital, returning mock question:", error);
        // Fallback para uma questão padrão em caso de erro.
        return mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
    }
};

export const generateTheoryLesson = async (topic: string): Promise<TheoryLesson> => {
    // Estratégia de Cache com Supabase
    const { data: cachedData, error: cacheError } = await supabase
        .from('lessons_cache')
        .select('lesson_data')
        .eq('topic', topic)
        .single();

    if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116: "No rows found"
        console.error('Error fetching from Supabase cache:', cacheError.message);
    }

    if (cachedData) {
        console.log(`Supabase Cache HIT for topic: ${topic}`);
        return cachedData.lesson_data as TheoryLesson;
    }

    console.log(`Supabase Cache MISS for topic: ${topic}. Fetching from API.`);

    const systemInstruction = 'Act as: Father Method Teacher. Level: 6th Grade (11yo). Output: STRICT JSON. No filler text, just the raw JSON object.';
    const prompt = `Generate a micro-lesson for the topic: "${topic}". 
    The content must have:
    1. A theory explanation of max 300 words, clear and with examples a 11-year-old would understand.
    2. Exactly 8 multiple-choice questions (MCQs) with progressive difficulty:
       - Questions 1-3: Fácil (basic concepts)
       - Questions 4-6: Médio (application)  
       - Questions 7-8: Desafio (exam-level, tricky)
    Each question must have 4 options and a detailed explanation of why the correct answer is correct.
    Focus: Pedro II/FAETEC exam level for 6th grade.`;

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API Timeout')), 25000) // 25s for 8 questions
        );

        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            exercises: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING },
                                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        correctOptionIndex: { type: Type.INTEGER },
                                        explanation: { type: Type.STRING, description: "Detailed explanation of why the correct answer is correct and others are wrong." }
                                    },
                                    required: ['question', 'options', 'correctOptionIndex', 'explanation']
                                }
                            }
                        },
                        required: ['topic', 'explanation', 'exercises']
                    },
                    temperature: 0.2
                }
            }),
            timeoutPromise
        ]) as GenerateContentResponse;

        if (!response.text) {
            throw new Error("Empty response from AI.");
        }

        const lessonData = JSON.parse(response.text) as TheoryLesson;

        // Salva no cache do Supabase para a próxima vez
        const { error: upsertError } = await supabase
            .from('lessons_cache')
            .upsert({ topic: topic, lesson_data: lessonData });

        if (upsertError) {
            console.error('Error saving lesson to Supabase cache:', upsertError.message);
        }

        return lessonData;

    } catch (error) {
        console.error(`Error generating theory lesson for topic "${topic}", returning mock lesson:`, error);

        // Intelligent Fallback: Check which subject the topic belongs to
        let subject: keyof typeof syllabus | 'Unknown' = 'Unknown';
        for (const subj in syllabus) {
            if (syllabus[subj as keyof typeof syllabus].includes(topic)) {
                subject = subj as keyof typeof syllabus;
                break;
            }
        }

        if (subject === 'Língua Portuguesa') {
            console.log("Serving Portuguese fallback lesson.");
            return mockLessonPortugues;
        } else {
            console.log("Serving Math fallback lesson.");
            return mockLesson; // Default to math mock
        }
    }
};

export const validateExamAnswer = async (question: Question, incorrectAnswer: string): Promise<AiExplanation | null> => {
    const prompt = `
    Você é um tutor de IA especialista no concurso do Colégio Pedro II. Sua missão é fornecer explicações claras e detalhadas para questões de provas anteriores, ajudando um aluno de 11 anos a entender não apenas o porquê errou, mas como o conteúdo é cobrado pela banca.

    ${question.baseText ? `**Texto Base da Questão:**\n---\n${question.baseText}\n---\n` : ''}

    **Análise da Questão:**
    **Tópico da Questão:** ${question.topic}
    **Questão da Prova:** "${question.text}"
    **Opções:** ${question.options.join('; ')}
    **Resposta Correta:** "${question.options[question.correctOptionIndex]}"
    **Resposta do Aluno (Incorreta):** "${incorrectAnswer}"

    **Sua Tarefa (Retorne em formato JSON):**

    1.  **attentionDetail:** Explique de forma simples e direta por que a resposta do aluno está incorreta. Foque no raciocínio errado que ele pode ter tido.
    2.  **keyInsight:** Com base no tópico "${question.topic}", explique o conceito teórico chave que a questão está avaliando e como a banca usou a questão para testar esse conhecimento.
    3.  **analogy.text:** Mostre o passo a passo ou o raciocínio correto para chegar à resposta certa.
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, sem markdown ou qualquer outro texto.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attentionDetail: { type: Type.STRING },
                        keyInsight: { type: Type.STRING },
                        analogy: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            },
                            required: ['text']
                        },
                    },
                    required: ['attentionDetail', 'keyInsight', 'analogy']
                }
            }
        });

        if (response.text) {
            // Gemini might return an object without the optional fields, so we ensure they exist.
            const parsed = JSON.parse(response.text);
            return {
                ...parsed,
                quickChallenge: parsed.quickChallenge || null,
                analogy: {
                    imageUrl: parsed.analogy?.imageUrl || '',
                    ...parsed.analogy
                }
            } as AiExplanation;
        }
        return null;

    } catch (error) {
        console.error("Error validating exam answer:", error);
        return getAIExplanation(question, incorrectAnswer); // Fallback to the generic explanation
    }
};