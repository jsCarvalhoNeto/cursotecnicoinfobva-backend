import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugStudentActivities() {
  try {
    console.log('Conectando ao banco de dados...');
    
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'josedo64_sisctibalbina',
      port: process.env.DB_PORT || 3306
    });

    console.log('Buscando informações para depuração...');

    // Primeiro, vamos ver quais alunos estão matriculados em quais disciplinas
    const studentEnrollmentsQuery = `
      SELECT 
        e.student_id,
        p.full_name as student_name,
        e.subject_id,
        s.name as subject_name
      FROM enrollments e
      JOIN profiles p ON e.student_id = p.user_id
      JOIN subjects s ON e.subject_id = s.id
      LIMIT 10
    `;
    const [enrollments] = await db.execute(studentEnrollmentsQuery);
    console.log('\nMatrículas de alunos (exemplo):');
    enrollments.forEach(enrollment => {
      console.log(`- Aluno: ${enrollment.student_name} (ID: ${enrollment.student_id}) | Disciplina: ${enrollment.subject_name} (ID: ${enrollment.subject_id})`);
    });

    // Vamos ver algumas atividades e suas submissões
    const activitiesWithSubmissionsQuery = `
      SELECT 
        a.id as activity_id,
        a.name as activity_name,
        a.subject_id,
        s.name as subject_name,
        e.student_id,
        p.full_name as student_name,
        ag.id as grade_id,
        ag.grade,
        ag.student_name as submission_student_name,
        ag.graded_at
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN enrollments e ON e.subject_id = a.subject_id
      LEFT JOIN profiles p ON e.student_id = p.user_id
      LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
      ORDER BY a.id, e.student_id
      LIMIT 20
    `;
    const [activities] = await db.execute(activitiesWithSubmissionsQuery);
    console.log('\nAtividades com submissões (exemplo):');
    activities.forEach(activity => {
      const status = activity.grade !== null ? 'completed' : 
                    activity.submission_student_name !== null ? 'submitted' : 'pending';
      console.log(`- Atividade: ${activity.activity_name} | Aluno: ${activity.student_name || 'N/A'} | Status: ${status} | Grade: ${activity.grade} | Submission: ${activity.submission_student_name}`);
    });

    // Vamos testar a query exata que é usada no controller
    const studentId = enrollments[0]?.student_id || 1; // Usar primeiro aluno encontrado ou ID 1
    console.log(`\nTestando query para aluno ID: ${studentId}`);

    // Obter as disciplinas do aluno
    const studentSubjectsQuery = `
      SELECT DISTINCT s.id as subject_id, s.name as subject_name, p.full_name as teacher_name
      FROM enrollments e
      JOIN subjects s ON e.subject_id = s.id
      JOIN users u ON s.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE e.student_id = ?
    `;
    const [studentSubjects] = await db.execute(studentSubjectsQuery, [studentId]);
    console.log(`Disciplinas do aluno:`, studentSubjects.map(s => s.subject_name));

    if (studentSubjects.length > 0) {
      const subjectIds = studentSubjects.map(s => s.subject_id);
      const activitiesQuery = `
        SELECT 
          a.*,
          p.full_name as teacher_name,
          s.name as subject_name,
          ag.grade as student_grade,
          ag.graded_at as grade_date,
          CASE 
            WHEN ag.grade IS NOT NULL THEN 'completed'
            WHEN ag.grade IS NULL AND ag.student_name IS NOT NULL THEN 'submitted'
            ELSE 'pending'
          END as status
        FROM activities a
        JOIN users u ON a.teacher_id = u.id
        JOIN profiles p ON u.id = p.user_id
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN enrollments e ON e.student_id = ? AND e.subject_id = a.subject_id
        LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
        WHERE a.subject_id IN (${subjectIds.map(() => '?').join(',')})
        ORDER BY a.created_at DESC
      `;
      const [activitiesResult] = await db.execute(activitiesQuery, [studentId, ...subjectIds]);
      console.log(`\nAtividades retornadas para aluno ${studentId}: ${activitiesResult.length}`);
      activitiesResult.forEach(activity => {
        console.log(`- ${activity.name} | Status: ${activity.status} | Grade: ${activity.student_grade}`);
      });

      // Vamos comparar com uma query mais direta para ver se há diferença
      const directQuery = `
        SELECT 
          a.id,
          a.name,
          s.name as subject_name,
          COUNT(ag.id) as submission_count,
          COUNT(CASE WHEN ag.grade IS NOT NULL THEN 1 END) as graded_count
        FROM activities a
        JOIN subjects s ON a.subject_id = s.id
        JOIN enrollments e ON e.subject_id = a.subject_id AND e.student_id = ?
        LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
        GROUP BY a.id, a.name, s.name
        ORDER BY a.created_at DESC
      `;
      const [directResult] = await db.execute(directQuery, [studentId]);
      console.log(`\nComparação direta (atividades com submissões):`);
      directResult.forEach(activity => {
        const status = activity.graded_count > 0 ? 'completed' : 
                      activity.submission_count > 0 ? 'submitted' : 'pending';
        console.log(`- ${activity.name} | Submissões: ${activity.submission_count} | Notas: ${activity.graded_count} | Status: ${status}`);
      });
    }

    await db.end();
    console.log('\nDepuração concluída!');

  } catch (error) {
    console.error('Erro ao executar o script de depuração:', error);
    process.exit(1);
  }
}

// Executar o script
debugStudentActivities();
