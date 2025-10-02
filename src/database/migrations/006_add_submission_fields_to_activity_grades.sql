-- Migration: Add submission fields to activity_grades table
-- This table will now store student activity submissions with file uploads

ALTER TABLE `activity_grades` 
ADD COLUMN `student_name` VARCHAR(255) NULL,
ADD COLUMN `team_members` TEXT NULL,
ADD COLUMN `file_path` VARCHAR(500) NULL,
ADD COLUMN `file_name` VARCHAR(255) NULL;
