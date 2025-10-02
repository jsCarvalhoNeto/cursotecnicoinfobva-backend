-- Migration: Create activity_grades table
-- This table will connect activities with grades for specific student enrollments

CREATE TABLE `activity_grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `activity_id` INT NOT NULL,
  `enrollment_id` INT NOT NULL,
  `grade` DECIMAL(5, 2) NOT NULL,
  `graded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `graded_by` INT NOT NULL,
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`graded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_activity_student` (`activity_id`, `enrollment_id`),
  INDEX `idx_activity_grades_activity_id` (`activity_id`),
  INDEX `idx_activity_grades_enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
