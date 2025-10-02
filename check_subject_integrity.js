import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSubjectIntegrity() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    // Verificar todas as disciplinas e suas associações
    console.log('=== Verificando integridade das disciplinas ===');
    
    const [subjects] = await db.execute(`
      SELECT s.id, s.name, s.teacher_id, p.full_name as teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      ORDER BY s.id
    `);
    
    console.log('Total de disciplinas:', subjects.length);
    
    for (const subject of subjects) {
      console.log(`\nDisciplina: ${subject.id} - ${subject.name}`);
      console.log(`  Professor: ${subject.teacher_name} (ID: ${subject.teacher_id})`);
      
      // Verificar se está na tabela teacher_subjects
      const [assoc] = await db.execute(`
        SELECT * FROM teacher_subjects WHERE subject_id = ?
      `, [subject.id]);
      
      console.log(`  Associada em teacher_subjects: ${assoc.length > 0 ? 'Sim' : 'Não'}`);
      
      if (assoc.length > 0) {
        console.log(`  Associações encontradas:`, assoc);
      }
    }

    // Verificar disciplinas que estão em teacher_subjects mas não estão associadas corretamente
    console.log('\n=== Verificando inconsistências ===');
    
    const [inconsistent] = await db.execute(`
      SELECT s.id, s.name, s.teacher_id, ts.teacher_id as ts_teacher_id
      FROM subjects s
      LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE s.teacher_id != ts.teacher_id OR (s.teacher_id IS NOT NULL AND ts.teacher_id IS NULL)
    `);
    
    console.log('Disciplinas com inconsistências:', inconsistent.length);
    inconsistent.forEach(row => {
      console.log(`  ${row.id} - ${row.name}: subject.teacher_id=${row.teacher_id}, teacher_subjects.teacher_id=${row.ts_teacher_id}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

checkSubjectIntegrity();
