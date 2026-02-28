-- ============================================
-- Atualizar image_url das questões 2018
-- Cole este SQL no Supabase SQL Editor e clique Run
-- ============================================

-- Q9: Tirinha Os Passarinhos - mentira
UPDATE questoes 
SET image_url = '/assets/exams/2018_q9.png' 
WHERE exam_id = 'cp2-2018' AND question_number = 9;

-- Q14: Tabela de preços cantina (sucos, vitaminas, sanduíches)
UPDATE questoes 
SET image_url = '/assets/exams/2018_q14.png' 
WHERE exam_id = 'cp2-2018' AND question_number = 14;

-- Q16: Planta estacionamento com quadrados 64m² e 121m²
UPDATE questoes 
SET image_url = '/assets/exams/2018_q16.png' 
WHERE exam_id = 'cp2-2018' AND question_number = 16;

-- Q17: Tabela eleição Grêmio Estudantil (votos e porcentagens)
UPDATE questoes 
SET image_url = '/assets/exams/2018_q17.png' 
WHERE exam_id = 'cp2-2018' AND question_number = 17;

-- Q19: Cartões PEDRO nas 5 caixas
UPDATE questoes 
SET image_url = '/assets/exams/2018_q19.png' 
WHERE exam_id = 'cp2-2018' AND question_number = 19;
