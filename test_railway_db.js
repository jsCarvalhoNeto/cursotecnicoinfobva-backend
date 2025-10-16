import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Função para parsear a DATABASE_URL e extrair os componentes
function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || '3306', // MySQL default port
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1) // Remove the leading '/'
    };
  } catch (error) {
    console.error('Erro ao parsear DATABASE_URL:', error);
    throw new Error('Formato inválido de DATABASE_URL');
  }
}

// Configuração da conexão usando DATABASE_URL ou variáveis separadas
const dbConfig = process.env.DATABASE_URL 
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'josedo64_sisctibalbina',
      port: parseInt(process.env.DB_PORT) || 3306,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectTimeout: 6000,
      multipleStatements: true,
      timezone: 'Z',
      charset: 'utf8mb4',
      insecureAuth: true,
      supportBigNumbers: true,
      bigNumberStrings: true
    };

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
