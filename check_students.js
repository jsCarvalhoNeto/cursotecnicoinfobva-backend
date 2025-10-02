import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkStudents() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Verificando alunos existentes ===');
    
    // Verificar todos os alunos no sistema
    const [students] = await db.execute(`
      SELECT u.id, u.email, p.full_name, p.student_registration, p.grade
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
      ORDER BY p.full_name
    `);
    
    console.log('Alunos existentes no sistema:');
    students.forEach(student => {
      console.log(`- ${student.id}: ${student.full_name} (${student.email}) - Matrícula: ${student.student_registration}, Série: ${student.grade}`);
    });

    console.log('\n=== Verificando disciplinas sem alunos matriculados ===');
    
    // Verificar disciplinas que não têm alunos matriculados
    const [emptySubjects] = await db.execute(`
      SELECT s.id, s.name, s.teacher_id, p.full_name as teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      LEFT JOIN enrollments e ON s.id = e.subject_id
      WHERE e.subject_id IS NULL
      GROUP BY s.id, s.name, s.teacher_id, p.full_name
      ORDER BY s.id
    `);
    
    console.log('Disciplinas sem alunos matriculados:');
    emptySubjects.forEach(subject => {
      console.log(`- ${subject.id}: ${subject.name} - Professor: ${subject.teacher_name}`);
    });

    console.log('\n=== Opções para matrícula ===');
    
    // Para cada disciplina vazia, sugerir matrícula dos alunos existentes
    for (const subject of emptySubjects) {
      console.log(`\nDisciplina: ${subject.name} (${subject.id})`);
      console.log('Alunos disponíveis para matrícula:');
      
      for (const student of students) {
        console.log(` - Matricular ${student.full_name} (ID: ${student.id})`);
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

checkStudents();
