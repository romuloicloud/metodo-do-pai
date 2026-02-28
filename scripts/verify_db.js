
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: q2025, count: c2025 } = await supabase.from('questoes').select('question_number, base_text', { count: 'exact' }).eq('exam_id', 'cp2-2025');
    const { data: q2017, count: c2017 } = await supabase.from('questoes').select('question_number, base_text', { count: 'exact' }).eq('exam_id', 'cp2-2017');

    console.log('--- 2025 ---');
    console.log('Count:', c2025);
    if (q2025 && q2025[0]) console.log('Q1 Base Text:', q2025[0].base_text?.substring(0, 50) + '...');

    console.log('\n--- 2017 ---');
    console.log('Count:', c2017);
    if (q2017 && q2017[0]) console.log('Q1 Base Text:', q2017[0].base_text?.substring(0, 50) + '...');
}

check();
