
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    const { data, error } = await supabase
        .from('questoes')
        .select('exam_id');

    if (error) {
        console.error(error);
        return;
    }

    const counts = data.reduce((acc, q) => {
        acc[q.exam_id] = (acc[q.exam_id] || 0) + 1;
        return acc;
    }, {});

    console.log("📊 Questões por Prova:");
    console.table(counts);
}

verify();
