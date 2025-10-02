// Vamos verificar a situação atual das disciplinas e atividades no banco de dados
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portal_escolar_balbina'
  });

  console.log('Disciplinas no sistema:');
  const [subjects] = await connection.execute('SELECT id, name, grade FROM subjects ORDER BY name');
  subjects.forEach(subject => {
    console.log(`- ${subject.id}: ${subject.name} (série: ${subject.grade || 'não definida'})`);
  });

  console.log('\nAtividades recentes:');
  const [activities] = await connection.execute(`
    SELECT a.id, a.name, a.grade as activity_grade, s.name as subject_name, s.grade as subject_grade
    FROM activities a
    JOIN subjects s ON a.subject_id = s.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `);
  activities.forEach(activity => {
    console.log(`- ${activity.id}: ${activity.name} (atividade série: ${activity.activity_grade}, disciplina série: ${activity.subject_grade}, disciplina: ${activity.subject_name})`);
 });

  // Verificar matrículas do aluno de exemplo (vamos pegar um aluno da 1º série)
  const [students] = await connection.execute(`
    SELECT u.id, u.email, p.full_name, p.grade
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role = 'student' AND p.grade = '1º Ano'
    LIMIT 1
  `);
  
  if (students.length > 0) {
    const student = students[0];
    console.log(`\nAluno da 1º Ano encontrado: ${student.full_name} (ID: ${student.id})`);
    
    // Verificar disciplinas em que o aluno está matriculado
    const [enrollments] = await connection.execute(`
      SELECT s.id, s.name, s.grade as subject_grade
      FROM enrollments e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.student_id = ?
    `, [student.id]);
    
    console.log('Disciplinas em que o aluno está matriculado:');
    enrollments.forEach(enrollment => {
      console.log(`- ${enrollment.id}: ${enrollment.name} (série: ${enrollment.subject_grade})`);
    });
  }

  await connection.end();
}

checkDatabase().catch(console.error);
