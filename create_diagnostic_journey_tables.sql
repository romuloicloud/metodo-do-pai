
-- =============================================
-- TABELAS PARA DIAGNÓSTICO + JORNADA GAMIFICADA
-- =============================================

-- 1. Resultado do Simulado Diagnóstico
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  score_total INTEGER NOT NULL DEFAULT 0,
  score_portugues INTEGER NOT NULL DEFAULT 0,
  score_matematica INTEGER NOT NULL DEFAULT 0,
  weak_topics TEXT[] NOT NULL DEFAULT '{}',
  strong_topics TEXT[] NOT NULL DEFAULT '{}',
  answers JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Progresso da Jornada de Estudos
CREATE TABLE IF NOT EXISTS public.journey_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  phase_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'locked',
  stars INTEGER DEFAULT 0,
  theory_done BOOLEAN DEFAULT false,
  training_done BOOLEAN DEFAULT false,
  boss_done BOOLEAN DEFAULT false,
  best_score INTEGER DEFAULT 0,
  ai_explanations JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, phase_number)
);

-- RLS
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário autenticado lê/escreve só seus próprios dados
CREATE POLICY "Users read own diagnostic" ON public.diagnostic_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diagnostic" ON public.diagnostic_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own journey" ON public.journey_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journey" ON public.journey_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journey" ON public.journey_progress
  FOR UPDATE USING (auth.uid() = user_id);
