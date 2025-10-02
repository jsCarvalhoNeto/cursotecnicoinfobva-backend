const mysql = require('mysql2/promise');
require('dotenv').config();

async function findTeacherPassword() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar informações do usuário com ID 8
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.password, p.full_name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = 8
    `);
    
    console.log('Usuário encontrado:');
    console.log(users[0]);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
 }
}

findTeacherPassword();
