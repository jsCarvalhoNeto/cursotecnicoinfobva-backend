-- Migration: Update activity_grades table to make grade and graded_by fields nullable
-- This fixes the issue where grade and graded_by were NOT NULL in the original table

ALTER TABLE `activity_grades` 
MODIFY COLUMN `grade` DECIMAL(5, 2) NULL,
MODIFY COLUMN `graded_by` INT NULL;
