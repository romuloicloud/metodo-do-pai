
-- 1. Habilitar DELETE para todos na tabela questoes (p/ desenvolvimento)
CREATE POLICY "Anon Delete Questoes" ON public.questoes FOR DELETE USING (true);

-- 2. Limpar os dados duplicados/antigos das provas 2017 e 2025
DELETE FROM public.questoes WHERE exam_id = 'cp2-2017';
DELETE FROM public.questoes WHERE exam_id = 'cp2-2025';

-- 3. (Opcional) Verificar se as tabelas teoria e treinamento também precisam de permissão de delete
-- CREATE POLICY "Anon Delete Teoria" ON public.teoria FOR DELETE USING (true);
-- CREATE POLICY "Anon Delete Treinamento" ON public.treinamento FOR DELETE USING (true);
