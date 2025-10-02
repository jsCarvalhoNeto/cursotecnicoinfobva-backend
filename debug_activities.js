import mysql from 'mysql2/promise';

async function testActivitiesQuery() {
  const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'josedo64_sisctibalbina'
  };
  
  const connection = await mysql.createConnection(config);

  try {
    // Testar a lógica passo a passo
    const student_id = 14;

    // 1. Verificar papel do aluno
    const [roles] = await connection.execute('SELECT role FROM user_roles WHERE user_id = ?', [student_id]);
    console.log('Papel do aluno 14:', roles);

    // 2. Verificar matrículas do aluno
    const [enrollments] = await connection.execute('SELECT subject_id FROM enrollments WHERE student_id = ?', [student_id]);
    console.log('Matriculas do aluno 14:', enrollments);

    if (enrollments.length > 0) {
      const subjectIds = enrollments.map(row => row.subject_id);
      console.log('IDs das disciplinas:', subjectIds);
      
      // 3. Verificar atividades para as disciplinas do aluno
      const activitiesQuery = `
        SELECT a.*, s.name as subject_name
        FROM activities a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.subject_id IN (${subjectIds.join(',')})
        ORDER BY a.created_at DESC
      `;
      const [activities] = await connection.execute(activitiesQuery);
      console.log('Atividades encontradas:', activities);
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

testActivitiesQuery();
