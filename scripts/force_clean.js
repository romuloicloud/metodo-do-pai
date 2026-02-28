
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clean() {
    console.log('🧹 Tentando limpar prova 2017...');
    const { data: d2017, error: e2017 } = await supabase.from('questoes').delete().eq('exam_id', 'cp2-2017');
    if (e2017) console.error('❌ Erro deletando 2017:', e2017);
    else console.log('✅ Delete 2017 disparado.');

    console.log('🧹 Tentando limpar prova 2025...');
    const { data: d2025, error: e2025 } = await supabase.from('questoes').delete().eq('exam_id', 'cp2-2025');
    if (e2025) console.error('❌ Erro deletando 2025:', e2025);
    else console.log('✅ Delete 2025 disparado.');

    // Verificando contagem imediata
    const { count: c1 } = await supabase.from('questoes').select('*', { count: 'exact', head: true }).eq('exam_id', 'cp2-2017');
    const { count: c2 } = await supabase.from('questoes').select('*', { count: 'exact', head: true }).eq('exam_id', 'cp2-2025');
    console.log('--- Contagem pós-delete ---');
    console.log('2017:', c1);
    console.log('2025:', c2);
}

clean();
