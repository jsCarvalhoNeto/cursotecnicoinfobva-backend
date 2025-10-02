import mysql from 'mysql2/promise';

async function checkActivitiesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'josedo64_sisctibalbina'
  });

  try {
    console.log('Verificando estrutura da tabela activities...\n');

    const [rows] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'activities'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'josedo64_sisctibalbina']);

    console.log('Estrutura da tabela activities:');
    console.log('==================================');
    rows.forEach((column, index) => {
      console.log(`${column.COLUMN_NAME}: ${column.COLUMN_TYPE} | NULLABLE: ${column.IS_NULLABLE} | DEFAULT: ${column.COLUMN_DEFAULT}`);
    });

    console.log('\nVerificação concluída!');

  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  } finally {
    await connection.end();
  }
}

checkActivitiesTable();
