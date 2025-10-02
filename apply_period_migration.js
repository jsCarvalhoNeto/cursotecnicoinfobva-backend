import mysql from 'mysql2/promise';

async function applyPeriodMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'josedo64_sisctibalbina'
  });

  try {
    console.log('Aplicando migration 009_add_period_evaluation_type_to_activities.sql...');

    // Verificar se os campos já existem
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'activities'
      AND COLUMN_NAME IN ('period', 'evaluation_type')
    `, [process.env.DB_NAME || 'josedo64_sisctibalbina']);

    if (columns.length > 0) {
      console.log('⚠ Campos period e evaluation_type já existem na tabela activities');
      return;
    }

    // Aplicar a migration
    await connection.execute(`
      ALTER TABLE \`activities\` 
      ADD COLUMN \`period\` ENUM('1º Período', '2º Período', '3º Período', '4º Período') NULL COMMENT 'Período do curso',
      ADD COLUMN \`evaluation_type\` ENUM('Avaliação Parcial', 'Avaliação Global') NULL COMMENT 'Tipo de avaliação'
    `);

    console.log('✅ Migration aplicada com sucesso!');

    // Verificar a estrutura atualizada
    console.log('\nVerificando estrutura atualizada da tabela activities:');
    const [rows] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'activities'
      AND COLUMN_NAME IN ('period', 'evaluation_type')
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'josedo64_sisctibalbina']);

    rows.forEach((column) => {
      console.log(`${column.COLUMN_NAME}: ${column.COLUMN_TYPE} | NULLABLE: ${column.IS_NULLABLE} | DEFAULT: ${column.COLUMN_DEFAULT} | COMMENT: ${column.COLUMN_COMMENT}`);
    });

  } catch (error) {
    console.error('Erro ao aplicar migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

applyPeriodMigration().catch(console.error);
