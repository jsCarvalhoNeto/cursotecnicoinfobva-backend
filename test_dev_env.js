// Script temporário para testar ambiente de desenvolvimento
process.env.NODE_ENV = 'development';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'josedo64_sisctibalbina';

import mysql from 'mysql2/promise';

// Configuração da conexão para teste de desenvolvimento
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'josedo64_sisctibalbina',
  port: 3306,
  ssl: false,
  connectTimeout: 60000,
  multipleStatements: true,
  timezone: 'Z',
  charset: 'utf8mb4',
  insecureAuth: true,
  supportBigNumbers: true,
  bigNumberStrings: true
};

console.log('🔍 Testando conexão com o banco de dados de desenvolvimento...');
console.log('Environment: development (forçado)');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);

async function testConnection() {
  let connection;
  try {
    console.log('\n🔐 Tentando conectar ao MySQL...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar SELECT básico
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query de teste bem-sucedida:', result);
    
    // Verificar banco de dados atual
    const [dbNameResult] = await connection.execute('SELECT DATABASE() as dbName;');
    console.log('📊 Banco de dados atual:', dbNameResult[0].dbName);
    
    // Verificar tabelas existentes
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [dbConfig.database]);
    
    console.log('📋 Tabelas existentes:', tables.map(t => t.table_name));
    
    await connection.end();
    console.log('🔒 Conexão encerrada com sucesso');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('Código do erro:', error.code);
    console.error('Número do erro:', error.errno);
    
    if (connection) {
      try {
        await connection.end();
        console.log('🔒 Conexão encerrada após erro');
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError.message);
      }
    }
  }
}

testConnection();
