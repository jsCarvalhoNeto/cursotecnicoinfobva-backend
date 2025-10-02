const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyMigration() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Aplicando migração da tabela teacher_subjects...');
    
    // Criar a tabela teacher_subjects
    const createTableSQL = `
      CREATE TABLE \`teacher_subjects\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`teacher_id\` INT NOT NULL,
        \`subject_id\` INT NOT NULL,
        \`assigned_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`unique_teacher_subject\` (\`teacher_id\`, \`subject_id\`),
        FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    await connection.execute(createTableSQL);
    console.log('✓ Tabela teacher_subjects criada com sucesso');
    
    // Adicionar índices
    await connection.execute('CREATE INDEX `idx_teacher_subjects_teacher_id` ON `teacher_subjects` (`teacher_id`);');
    console.log('✓ Índice idx_teacher_subjects_teacher_id criado');
    
    await connection.execute('CREATE INDEX `idx_teacher_subjects_subject_id` ON `teacher_subjects` (`subject_id`);');
    console.log('✓ Índice idx_teacher_subjects_subject_id criado');
    
    // Agora vamos migrar os dados existentes da tabela subjects para a nova tabela
    // Copiar associações existentes de subjects.teacher_id para teacher_subjects
    const [existingSubjects] = await connection.execute(`
      SELECT id, teacher_id FROM subjects WHERE teacher_id IS NOT NULL AND teacher_id != 0
    `);
    
    console.log(`Encontradas ${existingSubjects.length} disciplinas com professor associado`);
    
    for (const subject of existingSubjects) {
      try {
        await connection.execute(`
          INSERT INTO teacher_subjects (teacher_id, subject_id) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
        `, [subject.teacher_id, subject.id]);
        console.log(`✓ Associada disciplina ${subject.id} ao professor ${subject.teacher_id}`);
      } catch (insertError) {
        console.log(`⚠ Erro ao associar disciplina ${subject.id} ao professor ${subject.teacher_id}:`, insertError.message);
      }
    }
    
    console.log('\nMigração concluída com sucesso!');
    
    // Verificar os resultados
    const [verification] = await connection.execute(`
      SELECT ts.*, s.name as subject_name, p.full_name as teacher_name
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN profiles p ON ts.teacher_id = p.user_id
      LIMIT 10
    `);
    
    console.log('\nVerificação - Associações criadas:');
    console.log(verification);
    
  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyMigration();
