import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkPendingActivities() {
  try {
    console.log('Conectando ao banco de dados...');
    
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'josedo64_sisctibalbina',
      port: process.env.DB_PORT || 3306
    });

    console.log('Buscando atividades pendentes que deveriam estar como submetidas...');

    // Vamos encontrar alunos que têm atividades que aparecem como pendentes
    // mas que já têm registros na tabela activity_grades (submissões)
    const pendingWithSubmissionsQuery = `
      SELECT DISTINCT
        e.student_id,
        p.full_name as student_name,
        a.id as activity_id,
        a.name as activity_name,
        s.name as subject_name,
        ag.student_name as submission_student_name,
        ag.grade,
        ag.graded_at
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      JOIN enrollments e ON a.subject_id = e.subject_id
      JOIN profiles p ON e.student_id = p.user_id
      JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
      WHERE ag.student_name IS NOT NULL
      ORDER BY e.student_id, a.created_at DESC
    `;
    const [activitiesWithSubmissions] = await db.execute(pendingWithSubmissionsQuery);
    console.log(`\nAtividades com submissões encontradas: ${activitiesWithSubmissions.length}`);
    
    // Agrupar por aluno para ver quem tem mais submissões
    const studentsWithSubmissions = {};
    activitiesWithSubmissions.forEach(activity => {
      if (!studentsWithSubmissions[activity.student_id]) {
        studentsWithSubmissions[activity.student_id] = {
          student_name: activity.student_name,
          activities: []
        };
      }
      studentsWithSubmissions[activity.student_id].activities.push({
        activity_name: activity.activity_name,
        subject_name: activity.subject_name,
        grade: activity.grade,
        status: activity.grade !== null ? 'completed' : 'submitted'
      });
    });

    console.log('\nAlunos com atividades submetidas:');
    Object.entries(studentsWithSubmissions).forEach(([studentId, studentData]) => {
      console.log(`\n- Aluno: ${studentData.student_name} (ID: ${studentId})`);
      console.log(`  Total de atividades: ${studentData.activities.length}`);
      const completed = studentData.activities.filter(a => a.status === 'completed').length;
      const submitted = studentData.activities.filter(a => a.status === 'submitted').length;
      console.log(`  Completadas: ${completed}, Submetidas: ${submitted}`);
      studentData.activities.forEach(activity => {
        console.log(`    • ${activity.activity_name} (${activity.subject_name}) - Status: ${activity.status} - Grade: ${activity.grade}`);
      });
    });

    // Agora vamos verificar a query exata do controller para ver se há discrepâncias
    console.log('\n' + '='.repeat(50));
    console.log('TESTANDO A QUERY EXATA DO CONTROLLER:');
    console.log('='.repeat(50));

    // Para cada aluno com atividades, vamos testar a query do controller
    for (const [studentId, studentData] of Object.entries(studentsWithSubmissions)) {
      console.log(`\nTestando para aluno: ${studentData.student_name} (ID: ${studentId})`);
      
      // Obter as disciplinas do aluno
      const enrollmentsQuery = `
        SELECT DISTINCT s.id as subject_id, s.name as subject_name, prof.full_name as teacher_name
        FROM enrollments e
        JOIN subjects s ON e.subject_id = s.id
        JOIN users u ON s.teacher_id = u.id
        JOIN profiles prof ON u.id = prof.user_id
        WHERE e.student_id = ?
      `;
      const [enrollments] = await db.execute(enrollmentsQuery, [studentId]);
      const subjectIds = enrollments.map(e => e.subject_id);
      
      if (subjectIds.length > 0) {
        // Usar a query exata do controller
        const controllerQuery = `
          SELECT 
            a.*,
            prof.full_name as teacher_name,
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
          JOIN profiles prof ON u.id = prof.user_id
          JOIN subjects s ON a.subject_id = s.id
          LEFT JOIN enrollments e ON e.student_id = ? AND e.subject_id = a.subject_id
          LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
          WHERE a.subject_id IN (${subjectIds.map(() => '?').join(',')})
          ORDER BY a.created_at DESC
        `;
        const [controllerResult] = await db.execute(controllerQuery, [studentId, ...subjectIds]);
        console.log(`  Atividades retornadas pela query do controller: ${controllerResult.length}`);
        controllerResult.forEach(activity => {
          console.log(`    • ${activity.name} - Status: ${activity.status} - Grade: ${activity.student_grade}`);
        });

        // Verificar se há atividades pendentes para este aluno
        const pendingActivities = controllerResult.filter(a => a.status === 'pending');
        if (pendingActivities.length > 0) {
          console.log(`  ⚠️  ATENÇÃO: ${pendingActivities.length} atividades pendentes para este aluno!`);
          pendingActivities.forEach(activity => {
            console.log(`    • ${activity.name} (${activity.subject_name})`);
          });
        } else {
          console.log(`  ✅ Nenhuma atividade pendente encontrada para este aluno.`);
        }
      }
    }

    await db.end();
    console.log('\nVerificação concluída!');

  } catch (error) {
    console.error('Erro ao executar o script de verificação:', error);
    process.exit(1);
  }
}

// Executar o script
checkPendingActivities();
