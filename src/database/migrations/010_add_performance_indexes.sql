-- Migration: Add performance indexes for better query performance
-- This migration adds indexes to improve performance of frequently used queries

-- Index para activity_grades para melhorar performance de buscas por atividade e matrícula
CREATE INDEX IF NOT EXISTS idx_activity_grades_activity_enrollment 
ON activity_grades(activity_id, enrollment_id);

-- Index para activities para melhorar performance de buscas por professor e disciplina
CREATE INDEX IF NOT EXISTS idx_activities_teacher_subject 
ON activities(teacher_id, subject_id);

-- Index para enrollments para melhorar performance de buscas por aluno e disciplina
CREATE INDEX IF NOT EXISTS idx_enrollments_student_subject 
ON enrollments(student_id, subject_id);

-- Index para activity_grades para melhorar performance de buscas por professor (graded_by)
CREATE INDEX IF NOT EXISTS idx_activity_grades_graded_by 
ON activity_grades(graded_by);

-- Index para activities para melhorar performance de buscas por data de criação
CREATE INDEX IF NOT EXISTS idx_activities_created_at 
ON activities(created_at);

-- Index para activity_grades para melhorar performance de buscas por data de avaliação
CREATE INDEX IF NOT EXISTS idx_activity_grades_graded_at 
ON activity_grades(graded_at);

-- Index composto para melhorar performance da query de atividades do aluno
CREATE INDEX IF NOT EXISTS idx_activities_subject_grade_type 
ON activities(subject_id, grade, type);

-- Index para melhorar performance de buscas na tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- Index para melhorar performance de buscas na tabela user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON user_roles(user_id, role);

-- Index para melhorar performance de buscas na tabela subjects
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id_grade 
ON subjects(teacher_id, grade);
