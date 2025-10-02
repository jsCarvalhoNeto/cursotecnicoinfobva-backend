import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkStudentEnrollments() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Verificando matrículas dos alunos ===');
    
    // Verificar todas as disciplinas e suas matrículas
    const [subjects] = await db.execute(`
      SELECT s.id, s.name, s.teacher_id, p.full_name as teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      ORDER BY s.id
    `);
    
    console.log('Disciplinas no sistema:');
    for (const subject of subjects) {
      console.log(`\nDisciplina: ${subject.id} - ${subject.name}`);
      console.log(`Professor: ${subject.teacher_name}`);
      
      // Verificar quantos alunos estão matriculados
      const [enrollments] = await db.execute(`
        SELECT COUNT(*) as student_count
        FROM enrollments e
        WHERE e.subject_id = ?
      `, [subject.id]);
      
      console.log(`Alunos matriculados: ${enrollments[0].student_count}`);
      
      if (enrollments[0].student_count > 0) {
        // Listar os alunos matriculados
        const [students] = await db.execute(`
          SELECT u.id, u.email, p.full_name
          FROM users u
          JOIN profiles p ON u.id = p.user_id
          JOIN enrollments e ON u.id = e.student_id
          WHERE e.subject_id = ?
        `, [subject.id]);
        
        console.log('Alunos matriculados:');
        students.forEach(student => {
          console.log(`  - ${student.id}: ${student.full_name} (${student.email})`);
        });
      }
    }

    console.log('\n=== Verificando atividades criadas ===');
    
    // Verificar atividades criadas recentemente
    const [activities] = await db.execute(`
      SELECT a.id, a.name, a.subject_id, s.name as subject_name, a.teacher_id, p.full_name as teacher_name
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    
    console.log('Atividades recentes:');
    activities.forEach(activity => {
      console.log(`- ${activity.id}: "${activity.name}" - Disciplina: ${activity.subject_name} (${activity.subject_id})`);
    });

    console.log('\n=== Verificando se atividades estão aparecendo para alunos ===');
    
    // Para cada disciplina com atividades, verificar se há alunos matriculados
    for (const subject of subjects) {
      const [subjectActivities] = await db.execute(`
        SELECT a.id, a.name
        FROM activities a
        WHERE a.subject_id = ?
      `, [subject.id]);
      
      if (subjectActivities.length > 0) {
        // Verificar alunos matriculados para esta disciplina específica
        const [enrollments] = await db.execute(`
          SELECT COUNT(*) as student_count
          FROM enrollments e
          WHERE e.subject_id = ?
        `, [subject.id]);
        
        console.log(`\nDisciplina: ${subject.name} (${subject.id})`);
        console.log(`Atividades: ${subjectActivities.length}`);
        console.log(`Alunos matriculados: ${enrollments[0].student_count}`);
        
        if (enrollments[0].student_count === 0) {
          console.log(`⚠️  ALERTA: Esta disciplina tem atividades mas nenhum aluno matriculado!`);
        }
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

checkStudentEnrollments();
