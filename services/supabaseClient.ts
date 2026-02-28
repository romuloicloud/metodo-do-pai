import { createClient } from '@supabase/supabase-js';

// Conexão inicializada com as credenciais fornecidas.
const supabaseUrl = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is not set. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
