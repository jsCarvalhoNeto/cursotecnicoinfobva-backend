import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('Verificando se a coluna grade existe na tabela subjects...');
    
    // Verificar se a coluna grade já existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'grade'
    `, [process.env.DB_NAME || 'informatica_wave']);

    if (columns.length === 0) {
      console.log('Adicionando coluna grade à tabela subjects...');
      await connection.execute(`
        ALTER TABLE subjects 
        ADD COLUMN grade ENUM('1º Ano', '2º Ano', '3º Ano') NULL
      `);
      console.log('✓ Coluna grade adicionada com sucesso!');
    } else {
      console.log('✓ Coluna grade já existe na tabela.');
    }

    // Verificar a estrutura atualizada
    const [updatedColumns] = await connection.execute('DESCRIBE subjects');
    console.log('\nEstrutura atualizada da tabela subjects:');
    updatedColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default} ${col.Extra}`);
    });

    console.log('\nSchema atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar schema:', error);
  } finally {
    await connection.end();
  }
}

updateSchema();
