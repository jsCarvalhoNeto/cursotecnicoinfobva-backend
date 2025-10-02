import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'josedo64_sisctibalbina'
};

async function updatePasswords() {
  let connection;
  try {
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar todos os usuários existentes
    const [users] = await connection.execute('SELECT id, password FROM users WHERE password NOT LIKE "$2b$10$%"'); // Senhas que não estão criptografadas com bcrypt
    console.log(`Encontrados ${users.length} usuários com senhas em texto plano`);
    
    for (const user of users) {
      console.log(`Atualizando senha para usuário ID: ${user.id}`);
      
      // Criptografar a senha existente
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Atualizar a senha no banco de dados
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`Senha atualizada para usuário ID: ${user.id}`);
    }
    
    console.log('Todas as senhas foram atualizadas com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar senhas:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão fechada');
    }
  }
}

updatePasswords();
