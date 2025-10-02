-- Migration: Create activities table
-- This table will store information about activities created by teachers

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

-- Add index for better performance on common queries
CREATE INDEX `idx_activities_teacher_id` ON `activities` (`teacher_id`);
CREATE INDEX `idx_activities_subject_id` ON `activities` (`subject_id`);
CREATE INDEX `idx_activities_grade` ON `activities` (`grade`);
