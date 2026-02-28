
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insertContent() {
    try {
        const jsonPath = path.resolve(__dirname, '../generated_content.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const contentList = JSON.parse(rawData);

        console.log(`Loaded ${contentList.length} topics from JSON.`);

        for (const item of contentList) {
            console.log(`Processing: ${item.materia} - ${item.topico}`);

            // 1. Insert Theory
            const { data: theoryData, error: theoryError } = await supabase
                .from('teoria')
                .insert({
                    materia: item.materia,
                    topico: item.topico,
                    conteudo_html: item.teoria.html
                })
                .select()
                .single();

            if (theoryError) {
                console.error(`Error inserting theory for ${item.topico}:`, theoryError);
                continue;
            }

            const theoryId = theoryData.id;
            console.log(`  > Theory inserted with ID: ${theoryId}`);

            // 2. Insert Questions (Training) linked to Theory
            const questionsToInsert = item.questoes.map(q => ({
                materia: item.materia,
                topico: item.topico,
                pergunta: q.pergunta,
                alternativas: q.alternativas,
                correta: q.correta,
                explicacao: q.explicacao,
                teoria_id: theoryId
            }));

            const { data: trainingData, error: trainingError } = await supabase
                .from('treinamento')
                .insert(questionsToInsert)
                .select();

            if (trainingError) {
                console.error(`  > Error inserting questions for ${item.topico}:`, trainingError);
            } else {
                console.log(`  > Successfully inserted ${trainingData.length} questions.`);
            }
        }

        console.log('All content processed!');

    } catch (err) {
        console.error('Script failed:', err);
    }
}

insertContent();
