import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Usar configurações de desenvolvimento local para testar
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'informatica_wave'  // Mudando para um nome mais comum de dev
};

async function fixActivityGradesStructure() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Verificando estrutura atual da tabela activity_grades...');
    
    // Verificar se as colunas de submissão existem
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'activity_grades' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('\nEstrutura atual da tabela activity_grades:');
    console.log('==========================================');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} | NULLABLE: ${col.IS_NULLABLE} | DEFAULT: ${col.COLUMN_DEFAULT}`);
    });
    
    // Verificar se as colunas de submissão existem
    const hasStudentName = columns.some(col => col.COLUMN_NAME === 'student_name');
    const hasTeamMembers = columns.some(col => col.COLUMN_NAME === 'team_members');
    const hasFilePath = columns.some(col => col.COLUMN_NAME === 'file_path');
    const hasFileName = columns.some(col => col.COLUMN_NAME === 'file_name');
    
    // Verificar se grade e graded_by são nullable
    const gradeColumn = columns.find(col => col.COLUMN_NAME === 'grade');
    const gradedByColumn = columns.find(col => col.COLUMN_NAME === 'graded_by');
    
    const gradeIsNullable = gradeColumn ? gradeColumn.IS_NULLABLE === 'YES' : false;
    const gradedByIsNullable = gradedByColumn ? gradedByColumn.IS_NULLABLE === 'YES' : false;
    
    console.log('\nVerificação de colunas:');
    console.log('student_name existe:', hasStudentName);
    console.log('team_members existe:', hasTeamMembers);
    console.log('file_path existe:', hasFilePath);
    console.log('file_name existe:', hasFileName);
    console.log('grade é nullable:', gradeIsNullable);
    console.log('graded_by é nullable:', gradedByIsNullable);
    
    // Adicionar colunas de submissão se não existirem
    if (!hasStudentName || !hasTeamMembers || !hasFilePath || !hasFileName) {
      console.log('\nAdicionando colunas de submissão...');
      
      if (!hasStudentName) {
        await connection.execute(`ALTER TABLE \`activity_grades\` ADD COLUMN \`student_name\` VARCHAR(255) NULL;`);
        console.log('✓ Coluna student_name adicionada');
      }
      
      if (!hasTeamMembers) {
        await connection.execute(`ALTER TABLE \`activity_grades\` ADD COLUMN \`team_members\` TEXT NULL;`);
        console.log('✓ Coluna team_members adicionada');
      }
      
      if (!hasFilePath) {
        await connection.execute(`ALTER TABLE \`activity_grades\` ADD COLUMN \`file_path\` VARCHAR(50) NULL;`);
        console.log('✓ Coluna file_path adicionada');
      }
      
      if (!hasFileName) {
        await connection.execute(`ALTER TABLE \`activity_grades\` ADD COLUMN \`file_name\` VARCHAR(255) NULL;`);
        console.log('✓ Coluna file_name adicionada');
      }
    } else {
      console.log('\n✓ Colunas de submissão já existem');
    }
    
    // Tornar grade e graded_by nullable se ainda não forem
    if (!gradeIsNullable || !gradedByIsNullable) {
      console.log('\nTornando campos nullable...');
      
      if (!gradeIsNullable) {
        await connection.execute(`ALTER TABLE \`activity_grades\` MODIFY COLUMN \`grade\` DECIMAL(5, 2) NULL;`);
        console.log('✓ Campo grade tornado nullable');
      }
      
      if (!gradedByIsNullable) {
        await connection.execute(`ALTER TABLE \`activity_grades\` MODIFY COLUMN \`graded_by\` INT NULL;`);
        console.log('✓ Campo graded_by tornado nullable');
      }
    } else {
      console.log('\n✓ Campos grade e graded_by já são nullable');
    }
    
    // Verificar a estrutura final
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'activity_grades' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('\nEstrutura final da tabela activity_grades:');
    console.log('==========================================');
    finalColumns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.COLUMN_TYPE} | NULLABLE: ${col.IS_NULLABLE} | DEFAULT: ${col.COLUMN_DEFAULT}`);
    });
    
    console.log('\n✓ Estrutura da tabela activity_grades corrigida com sucesso!');
    
    await connection.end();
    console.log('\nFix concluído!');
  } catch (error) {
    console.error('Erro ao corrigir estrutura da tabela:', error);
    console.error('Detalhes do erro:', error.message);
    
    // Se não conseguir conectar ao banco local, mostrar mensagem informativa
    if (error.code === 'ENOTFOUND') {
      console.log('\n⚠️  Não foi possível conectar ao banco de dados local.');
      console.log('💡 Para resolver o problema no ambiente de produção:');
      console.log('   1. Acesse o Railway e execute as migrações 006 e 007 manualmente');
      console.log('   2. Ou entre em contato com o administrador do banco de dados');
      console.log('\nMigrações necessárias:');
      console.log('   - 006_add_submission_fields_to_activity_grades.sql');
      console.log('   - 007_update_activity_grades_nullable_fields.sql');
    }
    
    throw error;
 }
}

fixActivityGradesStructure().catch(console.error);
