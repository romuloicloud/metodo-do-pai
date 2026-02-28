-- ============================================
-- Atualizar image_url das questões 2017
-- Cole este SQL no Supabase SQL Editor e clique Run
-- ============================================

-- Q7: Tirinha Armandinho - onça no zoo
UPDATE questoes 
SET image_url = '/assets/exams/2017_q7.png' 
WHERE exam_id = 'cp2-2017' AND question_number = 7;

-- Q9: Tirinha Armandinho - humanos e animais
UPDATE questoes 
SET image_url = '/assets/exams/2017_q9.png' 
WHERE exam_id = 'cp2-2017' AND question_number = 9;

-- Q11: Tirinha Hagar - dieta
UPDATE questoes 
SET image_url = '/assets/exams/2017_q11.png' 
WHERE exam_id = 'cp2-2017' AND question_number = 11;

-- Q14: Jarros de barro com escala
UPDATE questoes 
SET image_url = '/assets/exams/2017_q14.png' 
WHERE exam_id = 'cp2-2017' AND question_number = 14;

-- Q17: Copos com escala musical
UPDATE questoes 
SET image_url = '/assets/exams/2017_q17.png' 
WHERE exam_id = 'cp2-2017' AND question_number = 17;

-- Q18: Tabela reciclagem
UPDATE questoes 
SET image_url = '/assets/exams/2017_q18.png' 
WHERE exam_id = 'cp2-2017' AND question_number = 18;

-- Q20: Emblemas CPII (duas imagens)
UPDATE questoes 
SET image_url = '/assets/exams/2017_q20a.png',
    image_url_2 = '/assets/exams/2017_q20b.png'
WHERE exam_id = 'cp2-2017' AND question_number = 20;
