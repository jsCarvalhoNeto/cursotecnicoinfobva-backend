import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkEnrollmentsSchema() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Estrutura da tabela enrollments ===');
    const [result] = await db.execute('DESCRIBE enrollments');
    result.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Key} ${row.Extra}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
  }
}

checkEnrollmentsSchema();
