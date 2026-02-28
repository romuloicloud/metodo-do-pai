
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function relabel() {
    console.log("🔄 Relabeling 'cp2-2025' to 'cp2-2024'...");
    const { data, error } = await supabase
        .from('questoes')
        .update({ exam_id: 'cp2-2024' })
        .eq('exam_id', 'cp2-2025');

    if (error) {
        console.error("❌ Error during relabeling:", error);
    } else {
        console.log("✅ Current questions moved to 'cp2-2024'. Slot 'cp2-2025' is now empty and ready for real data.");
    }
}

relabel();
