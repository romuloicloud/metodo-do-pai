
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
const BATCH_SIZE = 5; // Questões por lote (máx recomendado: 10)

if (!GEMINI_API_KEY) {
    console.error("❌ Erro: VITE_GEMINI_API_KEY não encontrada no .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const syllabus = {
    'Língua Portuguesa': [
        'Compreensão Textual', 'Análise Linguística', 'Mecanismos de Coesão'
    ],
    'Matemática': [
        'Números', 'Álgebra', 'Geometria', 'Grandezas e Medidas', 'Probabilidade e Estatística'
    ]
};

// --- Anti-Repetition: Fetch existing questions ---
async function getExistingQuestions(subject, topic) {
    const { data, error } = await supabase
        .from('treinamento')
        .select('pergunta')
        .eq('materia', subject)
        .eq('topico', topic);

    if (error) {
        console.error("   ⚠️ Erro ao buscar questões existentes:", error.message);
        return [];
    }
    return (data || []).map(q => q.pergunta);
}

// --- Generators ---
async function generateTheory(subject, topic) {
    const prompt = `
    Você é o "Pai Tutor", um especialista em concursos (Pedro II/FAETEC). 
    Crie um conteúdo teórico sobre "${topic}" (${subject}) focado em MACETES, LÓGICA RÁPIDA e AGILIDADE.
    
    Estrutura Obrigatória (HTML):
    1. <h3>Título Criativo</h3> (Ex: "Matando a Charada da Crase" ou "Fração sem Trauma")
    2. <p>Introdução direta</p> (Conexão com o dia a dia)
    3. <h4>O Pulo do Gato (Macetes)</h4>: Lista <ul> com 3 dicas de ouro para resolver rápido.
    4. <h4>Exemplo de Mestre</h4>: Um exemplo resolvido passo a passo mostrando o raciocínio lógico.
    5. <div class="alert">Dica de Prova: O que a banca adora pedir sobre isso.</div>

    Output: Apenas o código HTML (sem markdown, sem backticks).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        return response.text.replace(/```html|```/g, '').trim();
    } catch (error) {
        console.error(`   ❌ Erro ao gerar teoria para ${topic}:`, error.message);
        return null;
    }
}

async function generateQuestions(subject, topic, existingQuestions = []) {
    // Build anti-repetition context
    let antiRepetitionBlock = '';
    if (existingQuestions.length > 0) {
        const sample = existingQuestions.slice(-20); // últimas 20 para contexto
        antiRepetitionBlock = `
    ⚠️ ATENÇÃO: As seguintes questões JÁ EXISTEM no banco. NÃO crie questões iguais ou muito parecidas:
    ${sample.map((q, i) => `${i + 1}. "${q}"`).join('\n    ')}
    
    Crie questões com enunciados DIFERENTES, abordando outros ângulos do mesmo tópico.`;
    }

    const prompt = `
    Crie exatamente ${BATCH_SIZE} questões de múltipla escolha INÉDITAS sobre "${topic}" (${subject}).
    Nível: 6º Ano (Concurso Pedro II/FAETEC).
    Estilo: Desafiador, contextualizado, variado.
    ${antiRepetitionBlock}

    Output Obrigatório: JSON Array exato, sem nenhum texto adicional.
    [
        {
            "pergunta": "texto da pergunta",
            "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "correta": 0,
            "explicacao": "Explicação detalhada e didática do raciocínio."
        }
    ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error(`   ❌ Erro ao gerar questões para ${topic}:`, error.message);
        return [];
    }
}

// --- Main Loop ---
async function runFactory() {
    console.log("🏭 ═══════════════════════════════════════════");
    console.log("   FÁBRICA DE CONTEÚDO DO PAI - v2.0");
    console.log("   Anti-Repetição Ativada | Lote: " + BATCH_SIZE);
    console.log("═══════════════════════════════════════════════\n");

    let totalTheory = 0;
    let totalQuestions = 0;

    for (const [subject, topics] of Object.entries(syllabus)) {
        console.log(`\n📚 ── ${subject.toUpperCase()} ──`);

        for (const topic of topics) {
            console.log(`\n   📌 ${topic}`);

            // 1. Check/Insert Theory
            let theoryId;
            const { data: existingTheory } = await supabase
                .from('teoria')
                .select('id')
                .eq('materia', subject)
                .eq('topico', topic)
                .maybeSingle();

            if (existingTheory) {
                console.log(`      ✅ Teoria já existe (ID: ${existingTheory.id})`);
                theoryId = existingTheory.id;
            } else {
                console.log(`      ✨ Gerando Teoria (Macetes & Lógica)...`);
                const htmlContent = await generateTheory(subject, topic);
                if (htmlContent) {
                    const { data: newTheory, error } = await supabase
                        .from('teoria')
                        .insert({ materia: subject, topico: topic, conteudo_html: htmlContent })
                        .select()
                        .single();

                    if (error) {
                        console.error("      ❌ Erro ao salvar teoria:", error.message);
                    } else {
                        console.log(`      💾 Teoria salva! (ID: ${newTheory.id})`);
                        theoryId = newTheory.id;
                        totalTheory++;
                    }
                }
            }

            if (!theoryId) continue;

            // 2. Fetch existing questions for anti-repetition
            const existingQuestions = await getExistingQuestions(subject, topic);
            console.log(`      📊 Questões existentes: ${existingQuestions.length}`);

            // 3. Generate new questions
            console.log(`      🧠 Gerando ${BATCH_SIZE} novas questões...`);
            const questions = await generateQuestions(subject, topic, existingQuestions);

            if (questions.length > 0) {
                const payload = questions.map(q => ({
                    materia: subject,
                    topico: topic,
                    pergunta: q.pergunta,
                    alternativas: q.alternativas,
                    correta: q.correta,
                    explicacao: q.explicacao,
                    teoria_id: theoryId
                }));

                const { error: qError } = await supabase
                    .from('treinamento')
                    .insert(payload);

                if (qError) {
                    console.error("      ❌ Erro ao salvar questões:", qError.message);
                } else {
                    console.log(`      ✅ +${questions.length} questões inseridas! (Total: ${existingQuestions.length + questions.length})`);
                    totalQuestions += questions.length;
                }
            } else {
                console.log("      ⚠️ Nenhuma questão gerada nesta rodada.");
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log("\n═══════════════════════════════════════════════");
    console.log(`🏁 PRODUÇÃO FINALIZADA!`);
    console.log(`   📖 Teorias novas: ${totalTheory}`);
    console.log(`   ❓ Questões novas: ${totalQuestions}`);
    console.log("═══════════════════════════════════════════════");
}

runFactory();
