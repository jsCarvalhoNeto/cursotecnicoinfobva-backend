import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
 host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'josedo64_sisctibalbina'
};

async function applyMigration() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Aplicando migração para tornar campos nullable...');
    
    // Modificar os campos para serem nullable
    await connection.execute(`
      ALTER TABLE \`activity_grades\` 
      MODIFY COLUMN \`grade\` DECIMAL(5, 2) NULL,
      MODIFY COLUMN \`graded_by\` INT NULL
    `);
    
    console.log('Migração aplicada com sucesso!');
    
    // Verificar a estrutura atualizada
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'activity_grades' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('\nEstrutura atualizada da tabela activity_grades:');
    console.log('===============================================');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} | NULLABLE: ${col.IS_NULLABLE} | DEFAULT: ${col.COLUMN_DEFAULT}`);
    });
    
    await connection.end();
    console.log('\nMigração concluída!');
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

applyMigration();
