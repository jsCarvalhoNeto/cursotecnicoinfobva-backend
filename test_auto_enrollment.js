import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testAutoEnrollment() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Testando matrícula automática por série ===');
    
    // Verificar alunos existentes e suas séries
    const [students] = await db.execute(`
      SELECT u.id, u.email, p.full_name, p.grade
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
      ORDER BY p.grade, p.full_name
    `);
    
    console.log('Alunos existentes:');
    students.forEach(student => {
      console.log(`- ${student.id}: ${student.full_name} - Série: ${student.grade}`);
    });
    
    // Criar uma nova disciplina para testar a matrícula automática
    const newSubjectName = 'Teste Matrícula Automática';
    const targetGrade = '1º Ano'; // Vamos usar a mesma série dos alunos existentes
    
    console.log(`\nCriando disciplina: "${newSubjectName}" para a série: "${targetGrade}"`);
    
    // Inserir a nova disciplina
    const [result] = await db.execute(`
      INSERT INTO subjects (name, description, schedule, max_students, teacher_id, grade)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [newSubjectName, 'Disciplina para teste de matrícula automática', null, 50, 8, targetGrade]);
    
    const newSubjectId = result.insertId;
    console.log(`Disciplina criada com ID: ${newSubjectId}`);
    
    // Verificar quantos alunos da série 1º Ano existem
    const [targetStudents] = await db.execute(`
      SELECT u.id, p.full_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE p.grade = ?
    `, [targetGrade]);
    
    console.log(`Alunos na série "${targetGrade}": ${targetStudents.length}`);
    targetStudents.forEach(student => {
      console.log(`  - ${student.id}: ${student.full_name}`);
    });
    
    // Matricular automaticamente os alunos da série na nova disciplina
    if (targetStudents.length > 0) {
      for (const student of targetStudents) {
        await db.execute(`
          INSERT INTO enrollments (student_id, subject_id, enrollment_date)
          VALUES (?, ?, NOW())
        `, [student.id, newSubjectId]);
      }
      console.log(`\n✅ ${targetStudents.length} alunos matriculados automaticamente na disciplina ${newSubjectId}`);
    }
    
    // Verificar as matrículas na nova disciplina
    const [enrolledStudents] = await db.execute(`
      SELECT u.id, p.full_name, p.grade
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.subject_id = ?
      ORDER BY p.full_name
    `, [newSubjectId]);
    
    console.log(`\nAlunos matriculados na nova disciplina (${newSubjectId}): ${enrolledStudents.length}`);
    enrolledStudents.forEach(student => {
      console.log(`  - ${student.id}: ${student.full_name} (${student.grade})`);
    });
    
    // Verificar se os alunos podem acessar atividades dessa disciplina
    const [activities] = await db.execute(`
      SELECT a.id, a.name
      FROM activities a
      WHERE a.subject_id = ?
    `, [newSubjectId]);
    
    if (activities.length === 0) {
      // Criar uma atividade de teste
      await db.execute(`
        INSERT INTO activities (name, subject_id, grade, type, teacher_id, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Atividade de Teste', newSubjectId, targetGrade, 'individual', 8, 'Atividade para teste de matrícula automática']);
      
      console.log(`\n✅ Atividade criada para testar acesso dos alunos`);
    }
    
    // Verificar quais alunos podem acessar atividades da nova disciplina
    const [accessibleActivities] = await db.execute(`
      SELECT e.student_id, u.email, p.full_name, a.id as activity_id, a.name as activity_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN activities a ON e.subject_id = a.subject_id
      WHERE e.subject_id = ?
    `, [newSubjectId]);
    
    console.log(`\nAtividades acessíveis para alunos da nova disciplina: ${accessibleActivities.length}`);
    accessibleActivities.forEach(activity => {
      console.log(`  - Aluno: ${activity.full_name} (${activity.email}) - Atividade: "${activity.activity_name}" (ID: ${activity.activity_id})`);
    });
    
    // Limpar: remover a disciplina de teste (opcional, para manter o banco limpo)
    console.log(`\nLimpando: removendo disciplina de teste (ID: ${newSubjectId})`);
    await db.execute('DELETE FROM enrollments WHERE subject_id = ?', [newSubjectId]);
    await db.execute('DELETE FROM activities WHERE subject_id = ?', [newSubjectId]);
    await db.execute('DELETE FROM subjects WHERE id = ?', [newSubjectId]);
    console.log('✅ Disciplina de teste removida');

  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await db.end();
 }
}

testAutoEnrollment();
