const mysql = require('mysql2/promise');
require('dotenv').config();

async function findTeacherCredentials() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Encontrar professores existentes
    const [teachers] = await connection.execute(`
      SELECT u.id, u.email, p.full_name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'teacher'
      LIMIT 5
    `);
    
    console.log('Professores encontrados:');
    teachers.forEach(teacher => {
      console.log(`ID: ${teacher.id}, Email: ${teacher.email}, Nome: ${teacher.full_name}`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

findTeacherCredentials();
