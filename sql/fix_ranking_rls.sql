-- Corrigir RLS na student_stats para que o ranking funcione para todos os alunos
-- Todos os autenticados podem LER todas as stats (necessário pro ranking)
-- Mas cada aluno só pode INSERIR/ATUALIZAR seus próprios dados

-- Remover políticas antigas de SELECT que podem estar restritivas
DROP POLICY IF EXISTS "Users can view own stats" ON public.student_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.student_stats;
DROP POLICY IF EXISTS "Alunos podem ver suas stats" ON public.student_stats;
DROP POLICY IF EXISTS "select_own_stats" ON public.student_stats;

-- Nova política: todos autenticados podem ver TODAS as stats (ranking)
CREATE POLICY "Ranking: todos podem ver stats" ON public.student_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Mesma coisa para topic_stats
DROP POLICY IF EXISTS "Users can view own topic stats" ON public.topic_stats;
DROP POLICY IF EXISTS "Users can view their own topic stats" ON public.topic_stats;
DROP POLICY IF EXISTS "select_own_topic_stats" ON public.topic_stats;

CREATE POLICY "Ranking: todos podem ver topic stats" ON public.topic_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Garantir que profiles também está acessível
DROP POLICY IF EXISTS "Profiles são visíveis para todos os autenticados" ON public.profiles;
CREATE POLICY "Profiles são visíveis para todos os autenticados" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');
