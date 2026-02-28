
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function refresh2017() {
    try {
        const jsonPath = path.resolve(__dirname, '../extracted_questions_2017_full.json');
        if (!fs.existsSync(jsonPath)) {
            console.error("❌ Erro: Arquivo JSON não encontrado!");
            return;
        }

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const questions = JSON.parse(rawData);

        console.log("🧹 Removendo dados antigos da prova 2017...");
        await supabase.from('questoes').delete().eq('exam_id', 'cp2-2017');

        console.log(`🚀 Inserindo Prova Completa 2017 (${questions.length} questões)...`);

        const questionsToInsert = questions.map(q => ({
            exam_id: 'cp2-2017',
            question_number: q.numero_original,
            subject: q.materia,
            topic: q.topico,
            base_text: q.texto_base,
            text: q.enunciado,
            options: q.alternativas,
            correct_option_index: q.correct_option_index,
            image_url: null
        }));

        const { data, error } = await supabase
            .from('questoes')
            .insert(questionsToInsert)
            .select();

        if (error) {
            console.error("❌ Erro na inserção:", error);
        } else {
            console.log(`✅ Sucesso! ${data.length} questões da Prova A de 2017 (com gabarito) inseridas.`);
        }

    } catch (err) {
        console.error('❌ Script falhou:', err);
    }
}

refresh2017();
