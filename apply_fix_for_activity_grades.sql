-- Fix para resolver o problema de erro 500 no envio de atividades do aluno
-- Este script deve ser executado no banco de dados do Railway (mysql.railway.internal)

-- Verificar a estrutura atual da tabela
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'activity_grades' 
AND TABLE_SCHEMA = 'railway'  -- ou o nome do seu schema no Railway
ORDER BY ORDINAL_POSITION;

-- Passo 1: Adicionar colunas de submissão se não existirem
-- Verificar se as colunas já existem antes de adicionar
-- (executar cada comando individualmente e ignorar erros se a coluna já existir)

ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `student_name` VARCHAR(255) NULL;
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `team_members` TEXT NULL;
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `file_path` VARCHAR(500) NULL;
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `file_name` VARCHAR(255) NULL;

-- Passo 2: Tornar os campos grade e graded_by nullable (correção do problema principal)
-- Este é o passo CRÍTICO que resolve o erro 500

ALTER TABLE `activity_grades` MODIFY COLUMN `grade` DECIMAL(5, 2) NULL;
ALTER TABLE `activity_grades` MODIFY COLUMN `graded_by` INT NULL;

-- Passo 3: Verificar a estrutura final
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'activity_grades' 
AND TABLE_SCHEMA = 'railway'  -- ou o nome do seu schema no Railway
ORDER BY ORDINAL_POSITION;

-- Passo 4: Testar a inserção que estava causando o erro
-- Esta query deve funcionar após as correções
INSERT INTO activity_grades (activity_id, enrollment_id, grade, graded_by, student_name, team_members, file_path, file_name)
VALUES (1, 1, NULL, NULL, 'Test Student', NULL, NULL, NULL);

-- Limpar o teste
DELETE FROM activity_grades WHERE student_name = 'Test Student' AND grade IS NULL LIMIT 1;

-- Mensagem de sucesso
SELECT 'Fix aplicado com sucesso! O erro 500 no envio de atividades do aluno deve estar resolvido.' as mensagem;
