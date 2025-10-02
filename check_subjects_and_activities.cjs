const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkSubjectAndEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'curso_balbina'
  });

  try {
    // Verificar se existe a disciplina "Redes de Computadores"
    const [subjects] = await connection.execute('SELECT * FROM subjects WHERE name LIKE "%Redes%"');
    console.log('Disciplinas com "Redes":', subjects);

    // Verificar todas as disciplinas
    const [allSubjects] = await connection.execute('SELECT * FROM subjects ORDER BY id');
    console.log('Todas as disciplinas:', allSubjects);

    // Verificar se há atividades para a disciplina de redes
    if (subjects.length > 0) {
      const subjectIds = subjects.map(s => s.id);
      const placeholders = subjectIds.map(() => '?').join(',');
      const [activities] = await connection.execute(`SELECT * FROM activities WHERE subject_id IN (${placeholders})`, subjectIds);
      console.log('Atividades para disciplinas de redes:', activities);
    }

    // Verificar matrículas para todas as disciplinas
    const [enrollments] = await connection.execute(`
      SELECT e.*, s.name as subject_name, p.full_name as student_name 
      FROM enrollments e 
      JOIN subjects s ON e.subject_id = s.id 
      JOIN users u ON e.student_id = u.id 
      JOIN profiles p ON u.id = p.user_id 
      ORDER BY e.subject_id
    `);
    console.log('Todas as matrículas:', enrollments);

    // Verificar se algum aluno está matriculado em "Redes de Computadores"
    if (subjects.length > 0) {
      const [redesEnrollments] = await connection.execute(`
        SELECT e.*, p.full_name as student_name 
        FROM enrollments e 
        JOIN users u ON e.student_id = u.id 
        JOIN profiles p ON u.id = p.user_id 
        WHERE e.subject_id = ?
      `, [subjects[0].id]);
      console.log('Matrículas em "Redes de Computadores":', redesEnrollments);
    }

  } finally {
    await connection.end();
  }
}

checkSubjectAndEnrollments();
