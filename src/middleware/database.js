import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { mockDbUtils } from '../lib/mockDatabase.js';

dotenv.config();

// Configuração da conexão: prioriza DATABASE_URL, senão usa variáveis separadas
const dbConnectionOptions = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '', // Senha vazia para phpMyAdmin
      database: process.env.DB_NAME || 'josedo64_sisctibalbina',
      port: parseInt(process.env.DB_PORT) || 3306,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectTimeout: 60000,
      // Remover acquireTimeout que está causando warnings no MySQL2
      // acquireTimeout: 60000,
      multipleStatements: true,
      // Configurações para melhor funcionamento em produção no Railway
      timezone: 'Z',
      charset: 'utf8mb4',
      // Configurações adicionais para Railway
      insecureAuth: true,
      supportBigNumbers: true,
      bigNumberStrings: true
    };

// Função para testar conexão com MySQL e verificar se tabelas existem
async function testMySQLConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConnectionOptions);

    // Pega o nome do banco de dados da conexão atual
    const [dbNameResult] = await connection.execute('SELECT DATABASE() as dbName;');
    const dbName = dbNameResult[0].dbName;

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

    await connection.end();
    return true;
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    console.log('MySQL não disponível, usando banco de dados mockado:', error.message);
    return false;
  }
}

// Middleware para criar conexão com banco de dados ou usar mock
export const dbConnectionMiddleware = async (req, res, next) => {
  try {
    // Testar conexão com MySQL
    const mysqlAvailable = await testMySQLConnection();

    if (mysqlAvailable) {
      // Usar MySQL real
      req.db = await mysql.createConnection(dbConnectionOptions);
      await req.db.beginTransaction();
      req.dbType = 'mysql';
      console.log('Conexão com banco de dados MySQL estabelecida e transação iniciada');
    } else {
      // Usar banco de dados mockado
      req.db = mockDbUtils;
      req.dbType = 'mock';
      console.log('Usando banco de dados mockado');
    }
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await req.db?.commit();
        } else {
          await req.db?.rollback();
        }
        await req.db?.end();
      } else {
        // Para mock, não há transações reais
        console.log('Operações mockadas concluídas');
      }
    } catch (error) {
      console.error('Erro ao finalizar transação:', error);
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
    console.error('Erro ao fazer rollback:', rollbackError);
  }
};
