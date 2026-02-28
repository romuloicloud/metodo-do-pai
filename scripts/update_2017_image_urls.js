/**
 * update_2017_image_urls.js
 * ========================
 * Atualiza os campos image_url e image_url_2 das questões de 2017 no Supabase.
 * 
 * IMPORTANTE: Antes de rodar este script, execute no Supabase SQL Editor:
 *   ALTER TABLE questoes ADD COLUMN IF NOT EXISTS image_url_2 TEXT NULL;
 * 
 * Uso: node scripts/update_2017_image_urls.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeamento: question_number → image_url (e image_url_2 para Q20)
const IMAGE_MAPPINGS = {
    7: { image_url: '/assets/exams/2017_q7.png' },
    9: { image_url: '/assets/exams/2017_q9.png' },
    11: { image_url: '/assets/exams/2017_q11.png' },
    14: { image_url: '/assets/exams/2017_q14.png' },
    17: { image_url: '/assets/exams/2017_q17.png' },
    18: { image_url: '/assets/exams/2017_q18.png' },
    20: { image_url: '/assets/exams/2017_q20a.png', image_url_2: '/assets/exams/2017_q20b.png' },
};

async function main() {
    console.log('🔧 Atualizando image_url das questões 2017 no Supabase...\n');

    const { data: questions, error } = await supabase
        .from('questoes')
        .select('id, question_number, image_url, image_url_2')
        .eq('exam_id', 'cp2-2017')
        .order('question_number', { ascending: true });

    if (error) {
        console.error('❌ Erro ao buscar questões:', error.message);
        process.exit(1);
    }

    if (!questions || questions.length === 0) {
        console.error('❌ Nenhuma questão encontrada para exam_id cp2-2017');
        process.exit(1);
    }

    console.log(`📋 ${questions.length} questões encontradas\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const q of questions) {
        const qNum = q.question_number;
        const mapping = IMAGE_MAPPINGS[qNum];

        if (mapping) {
            const updateData = { image_url: mapping.image_url };
            if (mapping.image_url_2) {
                updateData.image_url_2 = mapping.image_url_2;
            }

            const { error } = await supabase
                .from('questoes')
                .update(updateData)
                .eq('id', q.id);

            if (error) {
                console.error(`  ❌ Q${qNum}: Erro - ${error.message}`);
                errors++;
            } else {
                const oldUrl = q.image_url || '(vazio)';
                console.log(`  ✅ Q${qNum}: ${oldUrl} → ${mapping.image_url}`);
                if (mapping.image_url_2) {
                    console.log(`         + image_url_2: ${mapping.image_url_2}`);
                }
                updated++;
            }
        } else {
            // Questão sem imagem - limpa campos se existirem
            if (q.image_url) {
                const { error } = await supabase
                    .from('questoes')
                    .update({ image_url: null, image_url_2: null })
                    .eq('id', q.id);

                if (error) {
                    console.error(`  ❌ Q${qNum}: Erro ao limpar - ${error.message}`);
                    errors++;
                } else {
                    console.log(`  🔄 Q${qNum}: Limpou image_url`);
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
