-- SQL Seed Script for Portal Curso Técnico Balbina
-- Use this script in the SQL tab of phpMyAdmin to insert initial test data.
-- Make sure you have already run schema.sql to create the tables.

-- 1. Create a test student user
-- NOTE: In a real application, passwords should be securely hashed.
INSERT INTO `users` (`email`, `password`) VALUES
('aluno.teste@email.com', 'senha123');

-- Get the ID of the student user we just created
SET @last_student_user_id = LAST_INSERT_ID();

-- 2. Create a profile for the test student
INSERT INTO `profiles` (`user_id`, `full_name`, `student_registration`) VALUES
(@last_student_user_id, 'Aluno de Teste', '2025001');

-- 3. Assign the 'student' role to the student user
INSERT INTO `user_roles` (`user_id`, `role`) VALUES
(@last_student_user_id, 'student');


-- 4. Create a test teacher user
INSERT INTO `users` (`email`, `password`) VALUES
('professor.teste@email.com', 'senha456');

-- Get the ID of the teacher user we just created
SET @last_teacher_user_id = LAST_INSERT_ID();

-- 5. Create a profile for the test teacher
INSERT INTO `profiles` (`user_id`, `full_name`) VALUES
(@last_teacher_user_id, 'Professor de Teste');

-- 6. Assign the 'teacher' role to the teacher user
INSERT INTO `user_roles` (`user_id`, `role`) VALUES
(@last_teacher_user_id, 'teacher');


-- 7. Create a test subject and assign it to the teacher
INSERT INTO `subjects` (`name`, `description`, `schedule`, `teacher_id`) VALUES
('Lógica de Programação', 'Fundamentos da programação e algoritmos.', 'Seg/Qua - 19:00-21:00', @last_teacher_user_id);

-- Get the ID of the subject we just created
SET @last_subject_id = LAST_INSERT_ID();


-- 8. Enroll the test student in the test subject
INSERT INTO `enrollments` (`student_id`, `subject_id`) VALUES
(@last_student_user_id, @last_subject_id);


-- 9. Create additional test subjects for the teacher
INSERT INTO `subjects` (`name`, `description`, `schedule`, `teacher_id`) VALUES
('Desenvolvimento Web', 'Desenvolvimento de aplicações web modernas.', 'Ter/Quin - 19:00-21:00', @last_teacher_user_id),
('Banco de Dados', 'Conceitos e práticas de banco de dados.', 'Sex - 19:00-21:00', @last_teacher_user_id);

-- 10. Create test activities
INSERT INTO `activities` (`name`, `subject_id`, `grade`, `type`, `teacher_id`) VALUES
('Atividade de Lógica - Exercícios', 1, '1º Ano - Técnico em Informática', 'individual', @last_teacher_user_id),
('Trabalho em Equipe - Projeto Web', 2, '2º Ano - Técnico em Informática', 'team', @last_teacher_user_id),
('Prova de Banco de Dados', 3, '2º Ano - Técnico em Informática', 'individual', @last_teacher_user_id);
