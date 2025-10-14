import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixStudentActivitiesStatus() {
  try {
    console.log('Conectando ao banco de dados...');
    
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'josedo64_sisctibalbina',
      port: process.env.DB_PORT || 3306
    });

    console.log('Verificando atividades pendentes para alunos que já submeteram...');

    // Primeiro, vamos verificar quais atividades estão marcadas como pendentes
    // mas já têm submissões no banco de dados
    const pendingActivitiesQuery = `
      SELECT DISTINCT
        a.id as activity_id,
        a.name as activity_name,
        e.student_id,
        p.full_name as student_name,
        s.name as subject_name
      FROM activities a
      JOIN enrollments e ON a.subject_id = e.subject_id
      JOIN profiles p ON e.student_id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
      WHERE ag.id IS NOT NULL AND ag.student_name IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM activity_grades ag2 
        WHERE ag2.activity_id = a.id AND ag2.enrollment_id = e.id AND ag2.grade IS NOT NULL
      )
    `;

    const [pendingActivities] = await db.execute(pendingActivitiesQuery);
    console.log(`Encontradas ${pendingActivities.length} atividades que devem estar como 'submitted' ou 'completed'`);

    if (pendingActivities.length > 0) {
      console.log('Atividades encontradas:');
      pendingActivities.forEach(activity => {
        console.log(`- Atividade: ${activity.activity_name} | Aluno: ${activity.student_name} | Disciplina: ${activity.subject_name}`);
      });

      // Atualizar o status para 'submitted' (na verdade, o status é determinado dinamicamente na query)
      // A correção real é garantir que os dados estejam consistentes
      console.log('\nVerificando consistência dos dados...');

      // Verificar se há atividades que já foram submetidas mas não têm status correto
      const checkSubmissionsQuery = `
        SELECT 
          ag.id as grade_id,
          ag.activity_id,
          a.name as activity_name,
          e.student_id,
          p.full_name as student_name,
          ag.student_name as submission_student_name,
          ag.grade,
          ag.graded_at
        FROM activity_grades ag
        JOIN activities a ON ag.activity_id = a.id
        JOIN enrollments e ON ag.enrollment_id = e.id
        JOIN profiles p ON e.student_id = p.user_id
        WHERE ag.student_name IS NOT NULL OR ag.grade IS NOT NULL
        ORDER BY ag.id DESC
      `;

      const [submissions] = await db.execute(checkSubmissionsQuery);
      console.log(`\nTotal de submissões encontradas: ${submissions.length}`);

      submissions.forEach(submission => {
        console.log(`- Atividade: ${submission.activity_name} | Aluno: ${submission.student_name} | Grade: ${submission.grade} | Status: ${submission.grade ? 'completed' : 'submitted'}`);
      });

      console.log('\nAjuste manual de status não é necessário pois o status é determinado dinamicamente na query.');
      console.log('O status é calculado como:');
      console.log('- "completed" quando grade IS NOT NULL');
      console.log('- "submitted" quando grade IS NULL AND student_name IS NOT NULL');
      console.log('- "pending" quando ambos são NULL ou não existem submissões');
    } else {
      console.log('Nenhuma inconsistência encontrada.');
    }

    // Vamos também verificar se há atividades pendentes que deveriam estar como 'submitted'
    console.log('\nVerificando atividades que estão como pendentes mas já foram submetidas...');
    const pendingCheckQuery = `
      SELECT DISTINCT
        a.id as activity_id,
        a.name as activity_name,
        e.student_id,
        p.full_name as student_name,
        s.name as subject_name
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      JOIN enrollments e ON a.subject_id = e.subject_id
      JOIN profiles p ON e.student_id = p.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM activity_grades ag WHERE ag.activity_id = a.id AND ag.enrollment_id = e.id
      )
      AND EXISTS (
        SELECT 1 FROM activity_grades ag2 WHERE ag2.activity_id = a.id AND ag2.enrollment_id = e.id AND ag2.student_name IS NOT NULL
      )
    `;

    const [pendingCheck] = await db.execute(pendingCheckQuery);
    console.log(`Atividades pendentes que já têm submissão: ${pendingCheck.length}`);

    if (pendingCheck.length > 0) {
      console.log('Essas atividades estão com status inconsistente.');
      pendingCheck.forEach(item => {
        console.log(`- Atividade: ${item.activity_name} | Aluno: ${item.student_name} | Disciplina: ${item.subject_name}`);
      });
    }

    await db.end();
    console.log('\nScript concluído com sucesso!');

  } catch (error) {
    console.error('Erro ao executar o script:', error);
    process.exit(1);
  }
}

// Executar o script
fixStudentActivitiesStatus();
