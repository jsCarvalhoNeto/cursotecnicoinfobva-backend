-- Migration para adicionar série aos estudantes

-- Adicionar coluna à tabela de perfis
ALTER TABLE `profiles` 
ADD COLUMN `grade` ENUM('1º Ano', '2º Ano', '3º Ano') NULL;

-- Atualizar a tabela de perfis para manter o histórico de alterações
ALTER TABLE `profiles` 
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
