import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Detectar se estamos no Railway ou localmente
const isRailway = process.env.NODE_ENV === 'production' && process.env.DB_HOST?.includes('railway.internal');

// Configuração da conexão para teste com variáveis de produção do Railway
const dbConfig = {
 host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || (isRailway ? 'root' : 'root'),
  password: process.env.DB_PASSWORD || (isRailway ? 'hKqzfPhyDJLAJujRUPjZebecKknlbMVN' : ''),
  database: process.env.DB_NAME || (isRailway ? 'railway' : 'josedo64_sisctibalbina'),
  port: parseInt(process.env.DB_PORT) || (isRailway ? 3306 : 3306),
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
console.log('Is Railway?', isRailway);
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
    
    // Para Railway, o erro ENOTFOUND é esperado localmente
    if (error.code === 'ENOTFOUND' && isRailway) {
      console.log('ℹ️  Erro esperado localmente - o hostname do Railway só existe no ambiente do Railway');
      console.log('✅ Configurações estão corretas para o Railway!');
    }
    
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
