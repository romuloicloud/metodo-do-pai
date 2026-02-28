
const { createClient } = require('@supabase/supabase-js');

// --- Configuration ---
const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyContent() {
    try {
        const { count: teoriaCount } = await supabase.from('teoria').select('*', { count: 'exact', head: true });
        const { count: treinoCount } = await supabase.from('treinamento').select('*', { count: 'exact', head: true });

        console.log(`Verified:`);
        console.log(`- Teoria: ${teoriaCount} rows`);
        console.log(`- Treinamento: ${treinoCount} rows`);

    } catch (err) {
        console.error('Script failed:', err);
    }
}

verifyContent();
