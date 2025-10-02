const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingAssociation() {
 const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Adicionar associação para a disciplina 17
    await connection.execute(`
      INSERT INTO teacher_subjects (teacher_id, subject_id) 
      VALUES (16, 17)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
    `);
    
    console.log('Associação para disciplina 17 adicionada com sucesso!');
    
    // Verificar todas as associações
    const [teacherSubjects] = await connection.execute(`
      SELECT * FROM teacher_subjects WHERE teacher_id = 16
    `);
    
    console.log('Todas as associações após correção:', teacherSubjects);
    
 } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
 }
}

addMissingAssociation();
