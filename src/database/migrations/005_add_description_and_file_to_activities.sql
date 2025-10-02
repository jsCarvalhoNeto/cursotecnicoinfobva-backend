-- Migration: Add description and file_path columns to activities table

ALTER TABLE `activities` 
ADD COLUMN `description` TEXT NULL,
ADD COLUMN `file_path` VARCHAR(500) NULL,
ADD COLUMN `file_name` VARCHAR(255) NULL;
