const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudentEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portal_escolar_balbina'
  });

  console.log('Verificando alunos da 1º série e suas matrículas em HTML...');

 // Verificar todos os alunos da 1º série
 const [students] = await connection.execute(`
    SELECT u.id, u.email, p.full_name, p.grade
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role = 'student' AND p.grade = '1º Ano'
    ORDER BY p.full_name
  `);

  console.log('\nAlunos da 1º Ano:');
  for (const student of students) {
    // Verificar se o aluno está matriculado em HTML (ID: 2)
    const [enrollment] = await connection.execute(`
      SELECT e.id as enrollment_id
      FROM enrollments e
      WHERE e.student_id = ? AND e.subject_id = 2
    `, [student.id]);
    
    console.log(`- ${student.id}: ${student.full_name} - Matriculado em HTML: ${enrollment.length > 0 ? 'SIM' : 'NÃO'}`);
  }

  // Verificar quais disciplinas os alunos da 1º série estão matriculados
  console.log('\nDisciplinas em que alunos da 1º série estão matriculados:');
  const [allEnrollments] = await connection.execute(`
    SELECT u.id as student_id, u.email, p.full_name, s.id as subject_id, s.name as subject_name, s.grade as subject_grade
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    JOIN profiles p ON u.id = p.user_id
    JOIN subjects s ON e.subject_id = s.id
    WHERE u.id IN (
      SELECT u2.id 
      FROM users u2
      JOIN profiles p2 ON u2.id = p2.user_id
      JOIN user_roles ur2 ON u2.id = ur2.user_id
      WHERE ur2.role = 'student' AND p2.grade = '1º Ano'
    )
    ORDER BY p.full_name, s.name
  `);

  for (const enrollment of allEnrollments) {
    console.log(`- ${enrollment.full_name} (ID: ${enrollment.student_id}) -> ${enrollment.subject_name} (ID: ${enrollment.subject_id}, série: ${enrollment.subject_grade})`);
  }

  await connection.end();
}

checkStudentEnrollments().catch(console.error);
