import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão para teste - prioriza localhost para desenvolvimento
const dbConfig = {
  host: process.env.NODE_ENV === 'production' ? process.env.DB_HOST : 'localhost',
  user: process.env.NODE_ENV === 'production' ? process.env.DB_USER : 'root',
  password: process.env.NODE_ENV === 'production' ? process.env.DB_PASSWORD : '',
  database: process.env.NODE_ENV === 'production' ? process.env.DB_NAME : 'josedo64_sisctibalbina',
  port: parseInt(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectTimeout: 60000,
  multipleStatements: true,
  timezone: 'Z',
  charset: 'utf8mb4',
  insecureAuth: true,
  supportBigNumbers: true,
  bigNumberStrings: true
};

console.log('🔍 Testando conexão com o banco de dados...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('Port:', dbConfig.port);
console.log('SSL:', dbConfig.ssl ? 'enabled' : 'disabled');

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
