const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSubjectAssociation() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar a disciplina criada
    const [subjects] = await connection.execute(`
      SELECT s.*, p.full_name as teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      WHERE s.teacher_id = 16
    `);
    
    console.log('Disciplinas do professor 16:', subjects);
    
    // Verificar associações na tabela teacher_subjects
    const [teacherSubjects] = await connection.execute(`
      SELECT * FROM teacher_subjects WHERE teacher_id = 16
    `);
    
    console.log('Associações na teacher_subjects:', teacherSubjects);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
 }
}

checkSubjectAssociation();
