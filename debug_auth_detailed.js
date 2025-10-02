const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'josedo64_sisctibalbina'
};

async function debugAuth() {
  let connection;
  try {
    console.log('=== Debug de Autenticação ===');
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar usuário específico
    const email = 'hudsondasilva@gmail.com';
    console.log(`Buscando usuário com email: ${email}`);
    
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.password, p.full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.email = ?
    `, [email]);

    if (users.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.full_name);
    console.log('  Password Hash:', user.password);
    console.log('  Password Length:', user.password.length);

    // Testar senha conhecida
    const testPassword = 'CCD5jR3#Ygm@';
    console.log(`\n=== Testando senha: ${testPassword} ===`);
    
    console.log('Comparando senha com bcrypt...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('Resultado da comparação:', isPasswordValid ? '✅ Válida' : '❌ Inválida');

    // Testar senha errada
    const wrongPassword = 'senhaerrada';
    console.log(`\n=== Testando senha errada: ${wrongPassword} ===`);
    
    console.log('Comparando senha errada com bcrypt...');
    const isWrongPasswordValid = await bcrypt.compare(wrongPassword, user.password);
    console.log('Resultado da comparação:', isWrongPasswordValid ? '✅ Válida' : '❌ Inválida');

    // Verificar papel do usuário
    console.log('\n=== Verificando papel do usuário ===');
    const [roles] = await connection.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );
    
    console.log('Papéis encontrados:', roles);
    const userRole = roles.length > 0 ? roles[0].role : 'student';
    console.log('Papel principal:', userRole);

  } catch (error) {
    console.error('Erro no debug:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão fechada');
    }
  }
}

debugAuth();
