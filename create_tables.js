import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root', // Usando 'root' como senha padrão para testes
  database: process.env.DB_NAME || 'josedo64_sisctibalbina',
  port: process.env.DB_PORT || 3306
};

const schemaSQL = `
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse order of creation to avoid foreign key constraints issues.
DROP TABLE IF EXISTS \`teacher_subjects\`;
DROP TABLE IF EXISTS \`attendances\`;
DROP TABLE IF EXISTS \`grades\`;
DROP TABLE IF EXISTS \`enrollments\`;
DROP TABLE IF EXISTS \`subjects\`;
DROP TABLE IF EXISTS \`user_roles\`;
DROP TABLE IF EXISTS \`profiles\`;
DROP TABLE IF EXISTS \`users\`;
DROP TABLE IF EXISTS \`calendar_events\`;
DROP TABLE IF EXISTS \`activities\`;

-- Tabela de Usuários: Armazena informações de login.
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Perfis: Armazena informações adicionais dos usuários.
CREATE TABLE \`profiles\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`student_registration\` VARCHAR(50) NULL UNIQUE,
  \`grade\` ENUM('1º Ano', '2º Ano', '3º Ano') NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Funções: Define o papel de cada usuário no sistema.
CREATE TABLE \`user_roles\` (
  \`user_id\` INT NOT NULL,
  \`role\` ENUM('admin', 'teacher', 'student') NOT NULL,
  PRIMARY KEY (\`user_id\`, \`role\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Disciplinas/Matérias.
CREATE TABLE \`subjects\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NULL,
 \`teacher_id\` INT NULL,
 \`schedule\` VARCHAR(255) NULL,
  \`max_students\` INT DEFAULT 40,
  \`grade\` ENUM('1º Ano', '2º Ano', '3º Ano') NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Matrículas: Associa estudantes a disciplinas.
CREATE TABLE \`enrollments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`student_id\` INT NOT NULL,
  \`subject_id\` INT NOT NULL,
  \`enrollment_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`unique_enrollment\` (\`student_id\`, \`subject_id\`),
  FOREIGN KEY (\`student_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Notas.
CREATE TABLE \`grades\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`enrollment_id\` INT NOT NULL,
  \`grade\` DECIMAL(5, 2) NOT NULL,
  \`description\` VARCHAR(255) NOT NULL COMMENT 'Ex: Prova 1, Trabalho Final',
  \`grade_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`enrollment_id\`) REFERENCES \`enrollments\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Faltas/Presenças.
CREATE TABLE \`attendances\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`enrollment_id\` INT NOT NULL,
  \`class_date\` DATE NOT NULL,
  \`present\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY \`unique_attendance\` (\`enrollment_id\`, \`class_date\`),
  FOREIGN KEY (\`enrollment_id\`) REFERENCES \`enrollments\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Eventos do Calendário.
CREATE TABLE \`calendar_events\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`date\` DATE NOT NULL,
  \`time\` TIME NULL,
  \`type\` ENUM('class', 'exam', 'deadline', 'meeting') DEFAULT 'class',
 \`description\` TEXT NULL,
 \`subject_id\` INT NULL,
 \`created_by\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Associação Professor-Disciplina (muitos-para-muitos)
CREATE TABLE \`teacher_subjects\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`teacher_id\` INT NOT NULL,
  \`subject_id\` INT NOT NULL,
  \`assigned_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`unique_teacher_subject\` (\`teacher_id\`, \`subject_id\`),
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
 FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Atividades: Armazena informações sobre atividades criadas pelos professores.
CREATE TABLE \`activities\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`subject_id\` INT NOT NULL,
  \`grade\` VARCHAR(100) NOT NULL,
  \`type\` ENUM('individual', 'team') DEFAULT 'individual',
  \`teacher_id\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar índices para melhorar performance
CREATE INDEX \`idx_teacher_subjects_teacher_id\` ON \`teacher_subjects\` (\`teacher_id\`);
CREATE INDEX \`idx_teacher_subjects_subject_id\` ON \`teacher_subjects\` (\`subject_id\`);

SET FOREIGN_KEY_CHECKS = 1;
`;

async function createTables() {
  try {
    console.log('Conectando ao banco de dados para criar tabelas...');
    
    // Conectar sem especificar o database primeiro para poder criar se não existir
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    console.log('Criando banco de dados se não existir...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log('Usando banco de dados:', dbConfig.database);
    await connection.execute(`USE \`${dbConfig.database}\``);
    
    console.log('Criando tabelas...');
    await connection.execute(schemaSQL);
    
    await connection.end();
    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  }
}

createTables();
