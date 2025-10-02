-- Migration para criar tabela de associação entre professores e disciplinas (muitos-para-muitos)

CREATE TABLE `teacher_subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `teacher_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_teacher_subject` (`teacher_id`, `subject_id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar índice para melhorar performance de buscas
CREATE INDEX `idx_teacher_subjects_teacher_id` ON `teacher_subjects` (`teacher_id`);
CREATE INDEX `idx_teacher_subjects_subject_id` ON `teacher_subjects` (`subject_id`);

-- Atualizar a tabela subjects para remover a chave estrangeira teacher_id (opcional)
-- Esta mudança permite que múltiplos professores possam lecionar a mesma disciplina
-- ALTER TABLE `subjects` DROP FOREIGN KEY `subjects_ibfk_1`;
-- ALTER TABLE `subjects` DROP COLUMN `teacher_id`;
