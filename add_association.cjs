const mysql = require('mysql2/promise');
require('dotenv').config();

async function addAssociation() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Adicionar associação manualmente
    await connection.execute(`
      INSERT INTO teacher_subjects (teacher_id, subject_id) 
      VALUES (16, 16)
    `);
    
    console.log('Associação adicionada com sucesso!');
    
    // Verificar novamente
    const [teacherSubjects] = await connection.execute(`
      SELECT * FROM teacher_subjects WHERE teacher_id = 16
    `);
    
    console.log('Associações após adição:', teacherSubjects);
    
 } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
 }
}

addAssociation();
