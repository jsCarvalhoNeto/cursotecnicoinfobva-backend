import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSubjectTeacherSync() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Verificando sincronização entre subjects.teacher_id e teacher_subjects ===');
    
    // Verificar todas as associações entre subjects e teacher_subjects
    const [results] = await db.execute(`
      SELECT 
        s.id as subject_id,
        s.name as subject_name,
        s.teacher_id as subject_teacher_id,
        p.full_name as subject_teacher_name,
        ts.teacher_id as ts_teacher_id,
        p2.full_name as ts_teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
      LEFT JOIN profiles p2 ON ts.teacher_id = p2.user_id
      ORDER BY s.id
    `);
    
    console.log('Total de disciplinas:', results.length);
    
    for (const row of results) {
      console.log(`\nDisciplina: ${row.subject_id} - ${row.subject_name}`);
      console.log(`  subjects.teacher_id: ${row.subject_teacher_id} (${row.subject_teacher_name})`);
      console.log(`  teacher_subjects.teacher_id: ${row.ts_teacher_id} (${row.ts_teacher_name})`);
      
      if (row.subject_teacher_id !== row.ts_teacher_id) {
        console.log(`  ⚠️  INCONSISTÊNCIA DETECTADA!`);
        console.log(`  As associações não estão sincronizadas!`);
      } else {
        console.log(`  ✅ Associações sincronizadas`);
      }
    }

    // Verificar disciplinas que estão em teacher_subjects mas não estão em subjects
    console.log('\n=== Verificando associações órfãs ===');
    const [orphaned] = await db.execute(`
      SELECT ts.subject_id, ts.teacher_id, s.name as subject_name, p.full_name as teacher_name
      FROM teacher_subjects ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN profiles p ON ts.teacher_id = p.user_id
      WHERE s.id IS NULL
    `);
    
    console.log('Associações órfãs (em teacher_subjects mas não em subjects):', orphaned.length);
    orphaned.forEach(row => {
      console.log(`  subject_id: ${row.subject_id}, teacher_id: ${row.teacher_id} (${row.teacher_name})`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

checkSubjectTeacherSync();
