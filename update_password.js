import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const updatePassword = async () => {
  try {
    // Criar hash da senha usando o mesmo método do sistema
    const hashedPassword = await bcrypt.hash('senha123', 10);
    
    // Conectar ao banco de dados
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'josedo64_sisctibalbina'
    });

    // Atualizar a senha do professor existente
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'professorsantosbva@gmail.com']
    );

    console.log('Senha atualizada com sucesso para o professor professorsantosbva@gmail.com');
    console.log('Nova senha: senha123');
    
    await connection.end();
  } catch (error) {
    console.error('Erro ao atualizar senha:', error.message);
  }
};

updatePassword();
