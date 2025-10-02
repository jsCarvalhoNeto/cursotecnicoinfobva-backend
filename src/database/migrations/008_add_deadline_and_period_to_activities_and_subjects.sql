-- Migration: Add deadline and period fields to activities and subjects table

-- Add deadline field to activities table
ALTER TABLE `activities` 
ADD COLUMN `deadline` DATETIME NULL COMMENT 'Data final de entrega da atividade';

-- Add semester and period fields to subjects table
ALTER TABLE `subjects` 
ADD COLUMN `semester` ENUM('1º Semestre', '2º Semestre') NULL COMMENT 'Semestre letivo',
ADD COLUMN `period` ENUM('1º Período', '2º Período', '3º Período', '4º Período') NULL COMMENT 'Período do curso';
