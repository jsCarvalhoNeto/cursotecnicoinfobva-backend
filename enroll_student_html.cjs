const mysql = require('mysql2/promise');
require('dotenv').config();

async function enrollStudentInHTML() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portal_escolar_balbina'
  });

  console.log('Matriculando aluno Estudante Teste (ID: 21) na disciplina HTML (ID: 2)...');
  
  const [result] = await connection.execute(
    'INSERT IGNORE INTO enrollments (student_id, subject_id) VALUES (?, ?)',
    [21, 2]
  );

  console.log('Resultado da matrícula:', result);

  // Verificar se a matrícula foi bem-sucedida
  const [check] = await connection.execute(
    'SELECT e.student_id, u.email, p.full_name, e.subject_id, s.name as subject_name FROM enrollments e JOIN users u ON e.student_id = u.id JOIN profiles p ON u.id = p.user_id JOIN subjects s ON e.subject_id = s.id WHERE e.student_id = 21 AND e.subject_id = 2'
  );

  if (check.length > 0) {
    console.log('Matrícula confirmada:');
    console.log('- Aluno: ' + check[0].full_name + ' (ID: ' + check[0].student_id + ')');
    console.log('- Disciplina: ' + check[0].subject_name + ' (ID: ' + check[0].subject_id + ')');
  } else {
    console.log('Matrícula não encontrada - aluno não foi matriculado');
  }

 await connection.end();
}

enrollStudentInHTML().catch(console.error);
