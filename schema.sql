-- SQL Schema for the Portal Curso Técnico Balbina
-- Use this script in the SQL tab of phpMyAdmin to create the necessary tables.
-- This version includes DROP TABLE statements for easy re-creation of the database.

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse order of creation to avoid foreign key constraints issues.
DROP TABLE IF EXISTS `subject_schedule_details`;
DROP TABLE IF EXISTS `subject_activities`;
DROP TABLE IF EXISTS `subject_resources`;
DROP TABLE IF EXISTS `subject_content`;
DROP TABLE IF EXISTS `teacher_subjects`;
DROP TABLE IF EXISTS `attendances`;
DROP TABLE IF EXISTS `grades`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `profiles`;
DROP TABLE IF EXISTS `users`;

-- Tabela de Usuários: Armazena informações de login.
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Perfis: Armazena informações adicionais dos usuários.
CREATE TABLE `profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `student_registration` VARCHAR(50) NULL UNIQUE,
  `grade` ENUM('1º Ano', '2º Ano', '3º Ano') NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Funções: Define o papel de cada usuário no sistema.
CREATE TABLE `user_roles` (
  `user_id` INT NOT NULL,
  `role` ENUM('admin', 'teacher', 'student') NOT NULL,
  PRIMARY KEY (`user_id`, `role`),
 FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Disciplinas/Matérias.
CREATE TABLE `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `teacher_id` INT NULL,
  `schedule` VARCHAR(255) NULL,
  `max_students` INT DEFAULT 40,
  `grade` ENUM('1º Ano', '2º Ano', '3º Ano') NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Matrículas: Associa estudantes a disciplinas.
CREATE TABLE `enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `enrollment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_enrollment` (`student_id`, `subject_id`),
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Notas.
CREATE TABLE `grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT NOT NULL,
  `grade` DECIMAL(5, 2) NOT NULL,
  `description` VARCHAR(255) NOT NULL COMMENT 'Ex: Prova 1, Trabalho Final',
  `grade_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Faltas/Presenças.
CREATE TABLE `attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT NOT NULL,
  `class_date` DATE NOT NULL,
  `present` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_attendance` (`enrollment_id`, `class_date`),
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Eventos do Calendário.
CREATE TABLE `calendar_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NULL,
  `type` ENUM('class', 'exam', 'deadline', 'meeting') DEFAULT 'class',
 `description` TEXT NULL,
  `subject_id` INT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Associação Professor-Disciplina (muitos-para-muitos)
CREATE TABLE `teacher_subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `teacher_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_teacher_subject` (`teacher_id`, `subject_id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
 FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Conteúdo de Disciplinas
CREATE TABLE `subject_content` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `section_type` ENUM('content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `order_index` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  INDEX `idx_subject_section` (`subject_id`, `section_type`, `order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para armazenar arquivos e recursos
CREATE TABLE `subject_resources` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `section_type` ENUM('content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources') NOT NULL,
  `resource_type` ENUM('file', 'link', 'video', 'pdf', 'image', 'document') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500),
  `file_url` VARCHAR(500),
  `description` TEXT,
  `order_index` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  INDEX `idx_subject_resource` (`subject_id`, `section_type`, `resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para armazenar atividades e exercícios
CREATE TABLE `subject_activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `activity_type` ENUM('activity', 'exercise', 'project', 'evaluation') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `instructions` TEXT,
  `deadline` DATETIME,
  `max_score` DECIMAL(5,2) DEFAULT 10.00,
  `order_index` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  INDEX `idx_subject_activity` (`subject_id`, `activity_type`, `deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para armazenar cronograma detalhado
CREATE TABLE `subject_schedule_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `lesson_number` INT NOT NULL,
  `lesson_title` VARCHAR(255) NOT NULL,
  `lesson_content` TEXT,
  `has_notes` BOOLEAN DEFAULT FALSE,
  `has_video` BOOLEAN DEFAULT FALSE,
  `is_av1` BOOLEAN DEFAULT FALSE,
  `is_av2` BOOLEAN DEFAULT FALSE,
  `schedule_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_lesson` (`subject_id`, `lesson_number`),
  INDEX `idx_subject_date` (`subject_id`, `schedule_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Atividades: Armazena informações sobre atividades criadas pelos professores.
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `subject_id` INT NOT NULL,
  `grade` VARCHAR(100) NOT NULL,
  `type` ENUM('individual', 'team') DEFAULT 'individual',
  `teacher_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar índices para melhorar performance
CREATE INDEX `idx_teacher_subjects_teacher_id` ON `teacher_subjects` (`teacher_id`);
CREATE INDEX `idx_teacher_subjects_subject_id` ON `teacher_subjects` (`subject_id`);

SET FOREIGN_KEY_CHECKS = 1;
