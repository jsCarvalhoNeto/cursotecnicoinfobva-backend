import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'informatica_wave'
};

async function checkTableStructure() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Verificando estrutura da tabela activity_grades...');
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'activity_grades' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('\nEstrutura da tabela activity_grades:');
    console.log('==================================');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} | NULLABLE: ${col.IS_NULLABLE} | DEFAULT: ${col.COLUMN_DEFAULT}`);
    });
    
    await connection.end();
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
  }
}

checkTableStructure();
