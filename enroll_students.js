import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function enrollStudents() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Matriculando alunos nas novas disciplinas ===');
    
    // Obter todos os alunos
    const [students] = await db.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
    `);
    
    // Obter as disciplinas sem alunos (Gestão de Startup e Redes de Computadores)
    const [emptySubjects] = await db.execute(`
      SELECT s.id, s.name
      FROM subjects s
      LEFT JOIN enrollments e ON s.id = e.subject_id
      WHERE e.subject_id IS NULL
      GROUP BY s.id, s.name
    `);
    
    console.log('Disciplinas sem alunos:');
    emptySubjects.forEach(subject => {
      console.log(`- ${subject.id}: ${subject.name}`);
    });
    
    console.log('\nAlunos existentes:');
    students.forEach(student => {
      console.log(`- ${student.id}: ${student.full_name} (${student.email})`);
    });
    
    // Matricular todos os alunos em ambas as disciplinas
    for (const subject of emptySubjects) {
      console.log(`\nMatriculando alunos na disciplina: ${subject.name} (${subject.id})`);
      
      for (const student of students) {
        // Verificar se o aluno já está matriculado (para evitar duplicatas)
        const [existingEnrollment] = await db.execute(`
          SELECT id FROM enrollments 
          WHERE student_id = ? AND subject_id = ?
        `, [student.id, subject.id]);
        
        if (existingEnrollment.length === 0) {
          await db.execute(`
            INSERT INTO enrollments (student_id, subject_id, enrollment_date)
            VALUES (?, ?, NOW())
          `, [student.id, subject.id]);
          
          console.log(`  ✅ ${student.full_name} (ID: ${student.id}) matriculado em ${subject.name}`);
        } else {
          console.log(`  ⚠️  ${student.full_name} (ID: ${student.id}) já estava matriculado em ${subject.name}`);
        }
      }
    }
    
    console.log('\n=== Verificação final ===');
    
    // Verificar as matrículas após a atualização
    for (const subject of emptySubjects) {
      const [enrolledStudents] = await db.execute(`
        SELECT u.id, p.full_name
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.subject_id = ?
        ORDER BY p.full_name
      `, [subject.id]);
      
      console.log(`\nDisciplina: ${subject.name} (${subject.id})`);
      console.log(`Total de alunos matriculados: ${enrolledStudents.length}`);
      enrolledStudents.forEach(student => {
        console.log(`  - ${student.id}: ${student.full_name}`);
      });
    }

  } catch (error) {
    console.error('Erro ao matricular alunos:', error);
  } finally {
    await db.end();
 }
}

enrollStudents();
