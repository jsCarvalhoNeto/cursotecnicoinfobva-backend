import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllStudentActivities() {
  try {
    console.log('Conectando ao banco de dados...');
    
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'josedo64_sisctibalbina',
      port: process.env.DB_PORT || 3306
    });

    console.log('Buscando todas as atividades e seus status para todos os alunos...');

    // Primeiro, vamos obter todos os alunos e suas matrículas
    const allStudentsQuery = `
      SELECT DISTINCT
        e.student_id,
        p.full_name as student_name
      FROM enrollments e
      JOIN profiles p ON e.student_id = p.user_id
      ORDER BY p.full_name
    `;
    const [allStudents] = await db.execute(allStudentsQuery);
    console.log(`Total de alunos encontrados: ${allStudents.length}`);

    // Para cada aluno, vamos verificar suas atividades pendentes
    for (const student of allStudents) {
      console.log(`\nVerificando aluno: ${student.student_name} (ID: ${student.student_id})`);
      
      // Obter as disciplinas do aluno
      const enrollmentsQuery = `
        SELECT DISTINCT s.id as subject_id, s.name as subject_name
        FROM enrollments e
        JOIN subjects s ON e.subject_id = s.id
        WHERE e.student_id = ?
      `;
      const [enrollments] = await db.execute(enrollmentsQuery, [student.student_id]);
      const subjectIds = enrollments.map(e => e.subject_id);
      
      if (subjectIds.length > 0) {
        // Buscar todas as atividades para as disciplinas do aluno
        const activitiesQuery = `
          SELECT 
            a.id as activity_id,
            a.name as activity_name,
            s.name as subject_name,
            ag.id as grade_id,
            ag.grade,
            ag.student_name as submission_student_name,
            CASE 
              WHEN ag.grade IS NOT NULL THEN 'completed'
              WHEN ag.grade IS NULL AND ag.student_name IS NOT NULL THEN 'submitted'
              ELSE 'pending'
            END as calculated_status
          FROM activities a
          JOIN subjects s ON a.subject_id = s.id
          LEFT JOIN enrollments e ON e.student_id = ? AND e.subject_id = a.subject_id
          LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
          WHERE a.subject_id IN (${subjectIds.map(() => '?').join(',')})
          ORDER BY a.created_at DESC
        `;
        const [activities] = await db.execute(activitiesQuery, [student.student_id, ...subjectIds]);
        
        console.log(`  Total de atividades: ${activities.length}`);
        
        // Contar por status
        const statusCount = {
          pending: 0,
          submitted: 0,
          completed: 0
        };
        
        activities.forEach(activity => {
          statusCount[activity.calculated_status]++;
        });
        
        console.log(`  Status: Pendentes: ${statusCount.pending}, Submetidas: ${statusCount.submitted}, Completadas: ${statusCount.completed}`);
        
        // Mostrar atividades pendentes (se houver)
        const pendingActivities = activities.filter(a => a.calculated_status === 'pending');
        if (pendingActivities.length > 0) {
          console.log(`  🚨 ATIVIDADES PENDENTES para ${student.student_name}:`);
          pendingActivities.forEach(activity => {
            console.log(`    • ${activity.activity_name} (${activity.subject_name})`);
          });
        }
      } else {
        console.log(`  ❌ Nenhuma disciplina encontrada para este aluno`);
      }
    }

    // Vamos também verificar se há atividades que NÃO têm submissão para ALGUM aluno matriculado
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICANDO ATIVIDADES PENDENTES GLOBAIS:');
    console.log('='.repeat(60));
    
    const pendingGlobalQuery = `
      SELECT 
        a.name as activity_name,
        s.name as subject_name,
        COUNT(e.student_id) as total_students,
        COUNT(ag.id) as submissions_received,
        (COUNT(e.student_id) - COUNT(ag.id)) as pending_submissions
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      JOIN enrollments e ON e.subject_id = a.subject_id
      LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
      GROUP BY a.id, a.name, s.name
      HAVING pending_submissions > 0
      ORDER BY pending_submissions DESC, a.created_at DESC
    `;
    const [pendingGlobal] = await db.execute(pendingGlobalQuery);
    console.log(`Atividades com submissões pendentes: ${pendingGlobal.length}`);
    
    pendingGlobal.forEach(activity => {
      console.log(`• ${activity.activity_name} (${activity.subject_name}) - ${activity.pending_submissions} de ${activity.total_students} alunos ainda não submeteram`);
    });

    await db.end();
    console.log('\nVerificação completa de todas as atividades dos alunos!');

  } catch (error) {
    console.error('Erro ao executar o script de verificação:', error);
    process.exit(1);
  }
}

// Executar o script
checkAllStudentActivities();
