
-- Tabela de Teoria
CREATE TABLE IF NOT EXISTS public.teoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    materia TEXT NOT NULL,         -- 'Matemática', 'Português', etc.
    topico TEXT NOT NULL,          -- ex: 'Frações', 'Compreensão Textual'
    conteudo_html TEXT NOT NULL,   -- Conteúdo rico em HTML (p/ renderizar no app)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Treinamento (Questões de fixação)
CREATE TABLE IF NOT EXISTS public.treinamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    materia TEXT NOT NULL,
    topico TEXT NOT NULL,
    pergunta TEXT NOT NULL,
    alternativas TEXT[] NOT NULL,  -- [A, B, C, D]
    correta INTEGER NOT NULL,      -- Índice da correta (0-3)
    explicacao TEXT NOT NULL,      -- Explicação detalhada (o "Pulo do Gato")
    teoria_id UUID REFERENCES public.teoria(id), -- Opcional: link com a teoria
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento ENABLE ROW LEVEL SECURITY;

-- Policies (Public Read, Anon Insert for script)
CREATE POLICY "Public Read Teoria" ON public.teoria FOR SELECT USING (true);
CREATE POLICY "Anon Insert Teoria" ON public.teoria FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Treinamento" ON public.treinamento FOR SELECT USING (true);
CREATE POLICY "Anon Insert Treinamento" ON public.treinamento FOR INSERT WITH CHECK (true);
