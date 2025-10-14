import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { mockDbUtils } from '../lib/mockDatabase.js';

dotenv.config();

console.log('🔍 Debug - Variáveis de ambiente do banco de dados:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Configuração da conexão: prioriza DATABASE_URL, senão usa variáveis separadas
let dbConnectionOptions;
if (process.env.DATABASE_URL) {
  console.log('🎯 Usando DATABASE_URL para conexão');
  // Para DATABASE_URL, precisamos parsear a string de conexão
  try {
    const url = new URL(process.env.DATABASE_URL);
    dbConnectionOptions = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // remove a barra inicial
      port: parseInt(url.port) || 3306,
      ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : false,
      connectTimeout: 6000,
      multipleStatements: true,
      timezone: 'Z',
      charset: 'utf8mb4',
      insecureAuth: true,
      supportBigNumbers: true,
      bigNumberStrings: true
    };
  } catch (error) {
    console.error('❌ Erro ao parsear DATABASE_URL:', error.message);
    // Fallback para variáveis separadas
    dbConnectionOptions = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '', // Senha vazia para phpMyAdmin
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
  }
} else {
  console.log('🎯 Usando variáveis de ambiente separadas para conexão');
  dbConnectionOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Senha vazia para phpMyAdmin
    database: process.env.DB_NAME || 'josedo64_sisctibalbina',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectTimeout: 600,
    multipleStatements: true,
    timezone: 'Z',
    charset: 'utf8mb4',
    insecureAuth: true,
    supportBigNumbers: true,
    bigNumberStrings: true
  };
}

console.log('📡 Configuração de conexão final:', {
  host: dbConnectionOptions.host,
  user: dbConnectionOptions.user,
  database: dbConnectionOptions.database,
  port: dbConnectionOptions.port
});

// Função para testar conexão com MySQL e verificar se tabelas existem
async function testMySQLConnection() {
  let connection;
  try {
    console.log('🔌 Tentando conectar ao MySQL...');
    connection = await mysql.createConnection(dbConnectionOptions);
    console.log('✅ Conexão MySQL estabelecida com sucesso!');

    // Pega o nome do banco de dados da conexão atual
    const [dbNameResult] = await connection.execute('SELECT DATABASE() as dbName;');
    const dbName = dbNameResult[0].dbName;
    console.log('📊 Banco de dados selecionado:', dbName);

    if (!dbName) {
      console.log('Nenhum banco de dados selecionado na conexão. Pulando verificação de tabelas.');
      await connection.end();
      // Consideramos a conexão bem-sucedida se o servidor respondeu, mesmo sem um DB.
      return true;
    }

    // Verificar se as tabelas principais existem
    const requiredTables = ['users', 'profiles', 'user_roles', 'subjects'];
    for (const table of requiredTables) {
      const [result] = await connection.execute(
        `
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = ? AND table_name = ?
      `,
        [dbName, table]
      );

      if (result[0].count === 0) {
        console.log(`Tabela ${table} não encontrada no banco de dados ${dbName}`);
        await connection.end();
        return false;
      }
    }

    console.log('✅ Verificação de tabelas concluída com sucesso!');
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão MySQL:', error.message);
    console.error('Código do erro:', error.code);
    console.error('Número do erro:', error.errno);
    
    // Para Railway, fornecer dicas mais específicas
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Dica: Verifique se as variáveis de ambiente estão configuradas corretamente no Railway.');
      console.log('💡 Dica: Confirme que o serviço MySQL está ativo no Railway.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Verifique se o host e porta do banco de dados estão corretos.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Dica: Verifique se o usuário e senha do banco de dados estão corretos.');
    }
    
    if (connection) {
      try {
        await connection.end();
        console.log('🔒 Conexão encerrada após erro');
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError.message);
      }
    }
    return false;
  }
}

// Middleware para criar conexão com banco de dados ou usar mock
export const dbConnectionMiddleware = async (req, res, next) => {
  try {
    console.log('🔍 Iniciando middleware de conexão com banco de dados...');
    console.log('🔍 URL da requisição:', req.url);
    
    // Para evitar overhead de teste de conexão em cada requisição, vamos tentar conectar diretamente
    // e usar mock se falhar
    try {
      console.log('🎯 Tentando conectar ao MySQL real...');
      req.db = await mysql.createConnection(dbConnectionOptions);
      
      // Não iniciar transação para rotas de autenticação
      const authRoutes = ['/auth', '/api/auth'];
      const isAuthRoute = authRoutes.some(route => req.url.startsWith(route));
      
      if (!isAuthRoute) {
        await req.db.beginTransaction();
        console.log('✅ Conexão com banco de dados MySQL estabelecida e transação iniciada');
      } else {
        console.log('✅ Conexão com banco de dados MySQL estabelecida (sem transação para rotas de autenticação)');
      }
      
      req.dbType = 'mysql';
    } catch (connectionError) {
      console.error('❌ Erro ao conectar ao MySQL real:', connectionError.message);
      console.log('🎯 Usando banco de dados mockado devido ao erro de conexão');
      req.db = mockDbUtils;
      req.dbType = 'mock';
      console.log('⚠️ Usando banco de dados mockado');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
    res.status(500).json({ error: 'Erro ao conectar ao banco de dados.' });
    return;
  }
  next();
};

// Middleware para commit/rollback da transação (ou operações mockadas)
export const transactionMiddleware = async (req, res, next) => {
  const originalSend = res.send;

  // Flag para controlar se a transação já foi finalizada
  let transactionFinished = false;

  const finishTransaction = async () => {
    if (transactionFinished) return;
    transactionFinished = true;

    try {
      if (req.dbType === 'mysql') {
        // Operações para MySQL real
        if (req.db && req.db.state !== 'disconnected' && req.db.state !== 'closed') {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await req.db.commit();
            console.log('✅ Transação MySQL commit realizada');
          } else {
            await req.db.rollback();
            console.log('.Rollback MySQL realizado');
          }
        } else {
          console.log('⚠️ Conexão já estava fechada, pulando commit/rollback');
        }
        
        if (req.db && req.db.state !== 'disconnected' && req.db.state !== 'closed') {
          await req.db.end();
          console.log('🔒 Conexão MySQL encerrada');
        } else {
          console.log('⚠️ Conexão já estava fechada, pulando encerramento');
        }
      } else {
        // Para mock, não há transações reais
        console.log('🎬 Operações mockadas concluídas');
      }
    } catch (error) {
      console.error('❌ Erro ao finalizar transação:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
    }
  };

  res.send = async function (data) {
    await finishTransaction();
    return originalSend.call(this, data);
  };

  res.on('finish', async () => {
    if (!transactionFinished) {
      await finishTransaction();
    }
  });

  res.on('close', async () => {
    if (!transactionFinished) {
      await finishTransaction();
    }
  });

  next();
};

// Função auxiliar para rollback em caso de erro
export const rollbackOnError = async (db) => {
  try {
    if (db && db.rollback) {
      await db.rollback();
    }
  } catch (rollbackError) {
    console.error('❌ Erro ao fazer rollback:', rollbackError);
  }
};
