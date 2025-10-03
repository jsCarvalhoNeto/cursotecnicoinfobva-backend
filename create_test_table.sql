-- Criar tabela de teste no banco de dados
CREATE TABLE IF NOT EXISTS `test_table` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir alguns dados de teste
INSERT INTO `test_table` (`name`, `description`) VALUES 
('Teste 1', 'Primeira entrada de teste'),
('Teste 2', 'Segunda entrada de teste'),
('Teste 3', 'Terceira entrada de teste');

SELECT * FROM `test_table`;
