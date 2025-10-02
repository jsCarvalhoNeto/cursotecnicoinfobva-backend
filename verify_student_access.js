import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function verifyStudentAccess() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Verificando acesso das atividades para alunos ===');
    
    // Para cada aluno, verificar quais atividades eles podem ver
    const [students] = await db.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
      ORDER BY p.full_name
    `);
    
    for (const student of students) {
      console.log(`\nAluno: ${student.full_name} (ID: ${student.id})`);
      
      // Verificar quais disciplinas o aluno está matriculado
      const [enrolledSubjects] = await db.execute(`
        SELECT s.id, s.name
        FROM subjects s
        JOIN enrollments e ON s.id = e.subject_id
        WHERE e.student_id = ?
        ORDER BY s.name
      `, [student.id]);
      
      console.log(`  Disciplinas matriculadas: ${enrolledSubjects.length}`);
      enrolledSubjects.forEach(sub => {
        console.log(`    - ${sub.id}: ${sub.name}`);
      });
      
      // Verificar quais atividades o aluno pode acessar
      const [accessibleActivities] = await db.execute(`
        SELECT a.id, a.name, s.name as subject_name
        FROM activities a
        JOIN subjects s ON a.subject_id = s.id
        JOIN enrollments e ON s.id = e.subject_id
        WHERE e.student_id = ?
        ORDER BY a.created_at DESC
      `, [student.id]);
      
      console.log(`  Atividades acessíveis: ${accessibleActivities.length}`);
      accessibleActivities.forEach(activity => {
        console.log(`    - ${activity.id}: "${activity.name}" - ${activity.subject_name}`);
      });
    }

    console.log('\n=== Verificando atividades específicas das novas disciplinas ===');
    
    // Verificar especificamente as atividades das novas disciplinas
    const [newActivities] = await db.execute(`
      SELECT a.id, a.name, s.name as subject_name, a.created_at
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      WHERE s.id IN (19, 20)  -- Gestão de Startup e Redes de Computadores
      ORDER BY a.created_at DESC
    `);
    
    console.log(`Atividades nas novas disciplinas: ${newActivities.length}`);
    newActivities.forEach(activity => {
      console.log(`- ${activity.id}: "${activity.name}" - ${activity.subject_name} (${activity.created_at})`);
    });
    
    // Verificar quantos alunos podem acessar essas atividades
    for (const activity of newActivities) {
      if (activity.subject_id) {  // Verificar se subject_id não é undefined
        const [studentsCount] = await db.execute(`
          SELECT COUNT(DISTINCT e.student_id) as student_count
          FROM enrollments e
          WHERE e.subject_id = ?
        `, [activity.subject_id]);
        
        console.log(` Atividade "${activity.name}" pode ser vista por ${studentsCount[0].student_count} aluno(s)`);
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

verifyStudentAccess();
