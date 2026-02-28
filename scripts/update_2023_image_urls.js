/**
 * update_2023_image_urls.js
 * ========================
 * Atualiza os campos image_url das questões de 2023 no Supabase
 * com os caminhos corretos das imagens renomeadas.
 * 
 * Uso: node scripts/update_2023_image_urls.js
 * 
 * Requer: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega .env
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas no .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeamento: numero_original → nome do arquivo de imagem
const IMAGE_MAPPINGS = {
    10: '/assets/exams/2023_q10.png',  // Tirinha Armandinho
    11: '/assets/exams/2023_q11.png',  // Malha quadriculada (rota Ana)
    12: '/assets/exams/2023_q12.png',  // Castelo em malha quadriculada
    14: '/assets/exams/2023_q14.png',  // Prismas/sólidos geométricos
    15: '/assets/exams/2023_q15.png',  // Gráfico pizza (rádio)
    17: '/assets/exams/2023_q17.png',  // Livros e cadernos (Thiago)
    18: '/assets/exams/2023_q18.png',  // Potes/jarras
    19: '/assets/exams/2023_q19.png',  // Retângulo dividido
};

async function main() {
    console.log('🔧 Atualizando image_url das questões 2023 no Supabase...\n');

    // Primeiro, busca as questões de 2023 para identificar os IDs
    const { data: questions, error: fetchError } = await supabase
        .from('questoes')
        .select('id, question_number, image_url')
        .eq('ano', 2023)
        .order('question_number', { ascending: true });

    if (fetchError) {
        // Tenta buscar por exam_id em vez de ano
        console.log('Tentando buscar por exam_id...');
        const { data: exams } = await supabase
            .from('exams')
            .select('id')
            .ilike('name', '%2023%')
            .limit(1);

        if (!exams || exams.length === 0) {
            console.error('❌ Nenhum exame de 2023 encontrado');
            process.exit(1);
        }

        const examId = exams[0].id;
        console.log(`Exame 2023 encontrado: ID = ${examId}`);

        const { data: qs, error: e2 } = await supabase
            .from('questoes')
            .select('id, question_number, image_url')
            .eq('exam_id', examId)
            .order('question_number', { ascending: true });

        if (e2) {
            console.error('❌ Erro ao buscar questões:', e2.message);
            process.exit(1);
        }

        await updateQuestions(qs);
        return;
    }

    await updateQuestions(questions);
}

async function updateQuestions(questions) {
    if (!questions || questions.length === 0) {
        console.error('❌ Nenhuma questão encontrada para 2023');
        process.exit(1);
    }

    console.log(`📋 ${questions.length} questões encontradas\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const q of questions) {
        const qNum = q.question_number;
        const imageUrl = IMAGE_MAPPINGS[qNum];

        if (imageUrl) {
            const { error } = await supabase
                .from('questoes')
                .update({ image_url: imageUrl })
                .eq('id', q.id);

            if (error) {
                console.error(`  ❌ Q${qNum}: Erro - ${error.message}`);
                errors++;
            } else {
                const oldUrl = q.image_url || '(vazio)';
                console.log(`  ✅ Q${qNum}: ${oldUrl} → ${imageUrl}`);
                updated++;
            }
        } else {
            // Questão sem imagem - limpa o campo se existir
            if (q.image_url) {
                const { error } = await supabase
                    .from('questoes')
                    .update({ image_url: null })
                    .eq('id', q.id);

                if (error) {
                    console.error(`  ❌ Q${qNum}: Erro ao limpar - ${error.message}`);
                    errors++;
                } else {
                    console.log(`  🔄 Q${qNum}: Limpou image_url (era: ${q.image_url})`);
                    updated++;
                }
            } else {
                skipped++;
            }
        }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   Atualizadas: ${updated}`);
    console.log(`   Sem alteração: ${skipped}`);
    console.log(`   Erros: ${errors}`);
}

main().catch(console.error);
