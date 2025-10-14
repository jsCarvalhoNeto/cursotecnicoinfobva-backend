import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configurações para conectar ao banco de dados do Railway
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'josedo64_sisctibalbina'
};

async function checkActivityGradesStructure() {
  try {
    console.log('Conectando ao banco de dados...');
    console.log('Host:', dbConfig.host);
    console.log('Database:', dbConfig.database);
    
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('\nVerificando estrutura da tabela activity_grades...');
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'activity_grades'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('❌ Tabela activity_grades NÃO EXISTE no banco de dados!');
      await connection.end();
      return;
    }
    
    console.log('✅ Tabela activity_grades existe');
    
    // Verificar a estrutura da tabela
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT, 
        COLUMN_TYPE,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'activity_grades' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('\nEstrutura atual da tabela activity_grades:');
    console.log('==========================================');
    columns.forEach(col => {
      const status = 
        (col.COLUMN_NAME === 'grade' && col.IS_NULLABLE === 'YES') ||
        (col.COLUMN_NAME === 'graded_by' && col.IS_NULLABLE === 'YES') ||
        (['student_name', 'team_members', 'file_path', 'file_name'].includes(col.COLUMN_NAME) && col.IS_NULLABLE === 'YES') ?
        '✅' : '⚠️';
      console.log(`${status} ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} | NULLABLE: ${col.IS_NULLABLE} | DEFAULT: ${col.COLUMN_DEFAULT}`);
    });
    
    // Verificar campos específicos que causam o problema
    const gradeColumn = columns.find(col => col.COLUMN_NAME === 'grade');
    const gradedByColumn = columns.find(col => col.COLUMN_NAME === 'graded_by');
    const studentNameColumn = columns.find(col => col.COLUMN_NAME === 'student_name');
    const teamMembersColumn = columns.find(col => col.COLUMN_NAME === 'team_members');
    const filePathColumn = columns.find(col => col.COLUMN_NAME === 'file_path');
    const fileNameColumn = columns.find(col => col.COLUMN_NAME === 'file_name');
    
    console.log('\nVerificação detalhada:');
    console.log('======================');
    
    console.log(`grade é nullable: ${gradeColumn ? gradeColumn.IS_NULLABLE === 'YES' : 'NÃO EXISTE'} ${!gradeColumn || gradeColumn.IS_NULLABLE !== 'YES' ? '❌' : '✅'}`);
    console.log(`graded_by é nullable: ${gradedByColumn ? gradedByColumn.IS_NULLABLE === 'YES' : 'NÃO EXISTE'} ${!gradedByColumn || gradedByColumn.IS_NULLABLE !== 'YES' ? '❌' : '✅'}`);
    console.log(`student_name existe: ${!!studentNameColumn} ${!studentNameColumn ? '❌' : '✅'}`);
    console.log(`team_members existe: ${!!teamMembersColumn} ${!teamMembersColumn ? '❌' : '✅'}`);
    console.log(`file_path existe: ${!!filePathColumn} ${!filePathColumn ? '❌' : '✅'}`);
    console.log(`file_name existe: ${!!fileNameColumn} ${!fileNameColumn ? '❌' : '✅'}`);
    
    // Testar a query de inserção que está causando o erro
    console.log('\nTestando query de inserção que causa o erro...');
    try {
      const testQuery = `
        INSERT INTO activity_grades (activity_id, enrollment_id, grade, graded_by, student_name, team_members, file_path, file_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      console.log('Query de inserção montada corretamente');
      
      // Tentar uma inserção de teste com valores NULL para campos problemáticos
      console.log('⚠️ Não executando a inserção de teste para não alterar dados');
      
    } catch (testError) {
      console.log('❌ Erro na query de teste:', testError.message);
    }
    
    // Verificar se há algum problema com a estrutura
    const issues = [];
    if (!gradeColumn || gradeColumn.IS_NULLABLE !== 'YES') {
      issues.push('Campo grade não é nullable (deve ser NULLABLE)');
    }
    if (!gradedByColumn || gradedByColumn.IS_NULLABLE !== 'YES') {
      issues.push('Campo graded_by não é nullable (deve ser NULLABLE)');
    }
    if (!studentNameColumn) {
      issues.push('Campo student_name não existe (migration 006 não aplicada)');
    }
    if (!teamMembersColumn) {
      issues.push('Campo team_members não existe (migration 006 não aplicada)');
    }
    if (!filePathColumn) {
      issues.push('Campo file_path não existe (migration 006 não aplicada)');
    }
    if (!fileNameColumn) {
      issues.push('Campo file_name não existe (migration 006 não aplicada)');
    }
    
    console.log('\nResumo dos problemas identificados:');
    console.log('====================================');
    if (issues.length === 0) {
      console.log('✅ Nenhum problema crítico identificado');
    } else {
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    // Recomendações
    console.log('\nRecomendações:');
    console.log('===============');
    if (issues.length > 0) {
      console.log('🚨 APLIQUE AS MIGRAÇÕES NO BANCO DE DADOS DO RAILWAY:');
      console.log('   - 006_add_submission_fields_to_activity_grades.sql');
      console.log('   - 007_update_activity_grades_nullable_fields.sql');
      console.log('\n   Comandos SQL para aplicar manualmente:');
      console.log('   ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `student_name` VARCHAR(255) NULL;');
      console.log('   ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `team_members` TEXT NULL;');
      console.log('   ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `file_path` VARCHAR(500) NULL;');
      console.log('   ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `file_name` VARCHAR(255) NULL;');
      console.log('   ALTER TABLE `activity_grades` MODIFY COLUMN `grade` DECIMAL(5, 2) NULL;');
      console.log('   ALTER TABLE `activity_grades` MODIFY COLUMN `graded_by` INT NULL;');
    } else {
      console.log('✅ A estrutura do banco de dados parece estar correta');
    }
    
    await connection.end();
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar a estrutura do banco de dados:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n⚠️  Não foi possível conectar ao banco de dados.');
      console.log('💡 Verifique as configurações de conexão no .env');
      console.log('💡 Para conectar ao Railway, use as credenciais do banco de dados do Railway');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n⚠️  Credenciais de acesso ao banco de dados incorretas');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n⚠️  Tabela activity_grades não existe');
    }
    
    throw error;
  }
}

// Executar a verificação
checkActivityGradesStructure().catch(console.error);
