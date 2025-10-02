const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkActivitiesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'informatica_wave'
    });
    
    const [tables] = await connection.execute('SHOW TABLES LIKE "activities"');
    console.log('Tabela activities existe:', tables.length > 0);
    
    if (tables.length > 0) {
      const [columns] = await connection.execute('DESCRIBE activities');
      console.log('Colunas da tabela activities:');
      columns.forEach(col => console.log(`${col.Field}: ${col.Type} ${col.Null} ${col.Key}`));
    } else {
      console.log('Tabela activities NÃO EXISTE');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Erro ao verificar tabela:', error.message);
  }
}
checkActivitiesTable();
