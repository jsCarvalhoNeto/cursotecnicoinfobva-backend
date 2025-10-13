// Script para testar a nova configuração de banco de dados
process.env.NODE_ENV = 'production';
process.env.DB_HOST = 'mysql.railway.internal';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'hKqzfPhyDJLAJujRUPjZebecKknlbMVN';
process.env.DB_NAME = 'railway';

import { dbConnectionMiddleware } from './src/middleware/database.js';

// Criar um mock de requisição e resposta para testar o middleware
const mockReq = {};
const mockRes = {
  status: function(code) {
    console.log('Status code:', code);
    return this;
  },
  json: function(data) {
    console.log('Response JSON:', data);
  }
};

console.log('🔍 Testando novo middleware de banco de dados...');
dbConnectionMiddleware(mockReq, mockRes, () => {
  console.log('✅ Middleware executado com sucesso!');
  console.log('DbType:', mockReq.dbType);
  console.log('DB Disponível:', !!mockReq.db);
});
