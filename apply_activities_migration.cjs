const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyActivitiesMigration() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Aplicando migração da tabela activities...');
    
    // Criar a tabela activities
    const createActivitiesTableSQL = `
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
    `;
    
    try {
      await connection.execute(createActivitiesTableSQL);
      console.log('✓ Tabela activities criada com sucesso');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠ Tabela activities já existe');
      } else {
        throw error;
      }
    }
    
    // Adicionar índices para a tabela activities
    try {
      await connection.execute('CREATE INDEX `idx_activities_teacher_id` ON `activities` (`teacher_id`);');
      console.log('✓ Índice idx_activities_teacher_id criado');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      } else {
        console.log('⚠ Índice idx_activities_teacher_id já existe');
      }
    }
    
    try {
      await connection.execute('CREATE INDEX `idx_activities_subject_id` ON `activities` (`subject_id`);');
      console.log('✓ Índice idx_activities_subject_id criado');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      } else {
        console.log('⚠ Índice idx_activities_subject_id já existe');
      }
    }
    
    try {
      await connection.execute('CREATE INDEX `idx_activities_grade` ON `activities` (`grade`);');
      console.log('✓ Índice idx_activities_grade criado');
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      } else {
        console.log('⚠ Índice idx_activities_grade já existe');
      }
    }
    
    console.log('Aplicando migração da tabela activity_grades...');
    
    // Criar a tabela activity_grades
    const createActivityGradesTableSQL = `
      CREATE TABLE \`activity_grades\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`activity_id\` INT NOT NULL,
        \`enrollment_id\` INT NOT NULL,
        \`grade\` DECIMAL(5, 2) NOT NULL,
        \`graded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`graded_by\` INT NOT NULL,
        FOREIGN KEY (\`activity_id\`) REFERENCES \`activities\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`enrollment_id\`) REFERENCES \`enrollments\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`graded_by\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_activity_student\` (\`activity_id\`, \`enrollment_id\`),
        INDEX \`idx_activity_grades_activity_id\` (\`activity_id\`),
        INDEX \`idx_activity_grades_enrollment_id\` (\`enrollment_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    try {
      await connection.execute(createActivityGradesTableSQL);
      console.log('✓ Tabela activity_grades criada com sucesso');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠ Tabela activity_grades já existe');
      } else {
        throw error;
      }
    }
    
    console.log('\\nMigrações de atividades concluídas!');
    
    // Verificar se as tabelas foram criadas
    const [activitiesCheck] = await connection.execute('SHOW TABLES LIKE "activities"');
    const [activityGradesCheck] = await connection.execute('SHOW TABLES LIKE "activity_grades"');
    
    console.log('\\nVerificação:');
    console.log('Tabela activities existe:', activitiesCheck.length > 0);
    console.log('Tabela activity_grades existe:', activityGradesCheck.length > 0);
    
  } catch (error) {
    console.error('Erro na migração das atividades:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyActivitiesMigration().catch(console.error);
