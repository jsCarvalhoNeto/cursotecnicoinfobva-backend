import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'josedo64_sisctibalbina'
};

async function createTestTable() {
  let connection;
  
  try {
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(config);
    console.log('Conexão estabelecida com sucesso!');
    
    // Criar tabela de teste
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Tabela test_table criada com sucesso!');
    
    // Inserir dados de teste
    const insertQuery = `
      INSERT INTO test_table (name, description) VALUES 
      ('Teste 1', 'Primeira entrada de teste'),
      ('Teste 2', 'Segunda entrada de teste'),
      ('Teste 3', 'Terceira entrada de teste');
    `;
    
    try {
      await connection.execute(insertQuery);
      console.log('✅ Dados de teste inseridos com sucesso!');
    } catch (error) {
      // Pode ocorrer erro se os dados já existirem, o que é normal
      console.log('ℹ Dados de teste já existiam ou foram inseridos anteriormente');
    }
    
    // Selecionar e mostrar os dados
    const selectQuery = 'SELECT * FROM test_table;';
    const [rows] = await connection.execute(selectQuery);
    
    console.log('\n📋 Dados na tabela test_table:');
    console.log(rows);
    
    console.log('\n🎉 Tabela de teste criada e populada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela de teste:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com o banco de dados encerrada');
    }
  }
}

// Executar a função
createTestTable();
