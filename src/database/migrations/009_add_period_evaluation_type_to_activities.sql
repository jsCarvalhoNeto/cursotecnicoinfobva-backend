-- Migration: Add period and evaluation type fields to activities table

ALTER TABLE `activities` 
ADD COLUMN `period` ENUM('1º Período', '2º Período', '3º Período', '4º Período') NULL COMMENT 'Período do curso',
ADD COLUMN `evaluation_type` ENUM('Avaliação Parcial', 'Avaliação Global') NULL COMMENT 'Tipo de avaliação';
