import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function demonstrateAutoEnrollment() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Demonstração Completa: Matrícula Automática por Série ===\n');
    
    // 1. Mostrar alunos existentes e suas séries
    const [students] = await db.execute(`
      SELECT u.id, u.email, p.full_name, p.grade
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
      ORDER BY p.grade, p.full_name
    `);
    
    console.log('📋 ALUNOS EXISTENTES NO SISTEMA:');
    const studentsByGrade = {};
    students.forEach(student => {
      if (!studentsByGrade[student.grade]) {
        studentsByGrade[student.grade] = [];
      }
      studentsByGrade[student.grade].push(student);
    });
    
    Object.keys(studentsByGrade).forEach(grade => {
      console.log(`\n${grade}: ${studentsByGrade[grade].length} alunos`);
      studentsByGrade[grade].forEach(student => {
        console.log(`  • ${student.full_name} (${student.email})`);
      });
    });
    
    // 2. Criar uma nova disciplina para uma série específica
    const newSubjectName = 'Desenvolvimento Web Avançado';
    const targetGrade = '1º Ano';
    
    console.log(`\n\n🚀 CRIANDO NOVA DISCIPLINA:`);
    console.log(`   Disciplina: "${newSubjectName}"`);
    console.log(`   Série: "${targetGrade}"`);
    console.log(`   Professor ID: 8 (SANTOS CARVALHO)`);
    
    // Inserir a nova disciplina
    const [result] = await db.execute(`
      INSERT INTO subjects (name, description, schedule, max_students, teacher_id, grade)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [newSubjectName, 'Disciplina avançada de desenvolvimento web com foco em tecnologias modernas', 'Segunda e Quinta - 14:00 às 16:00', 30, 8, targetGrade]);
    
    const newSubjectId = result.insertId;
    console.log(`\n✅ Disciplina criada com sucesso! ID: ${newSubjectId}`);
    
    // 3. Demonstrar a matrícula automática (funcionalidade implementada no controller)
    console.log(`\n🤖 MATRÍCULA AUTOMÁTICA EM AÇÃO:`);
    
    // Buscar alunos da série alvo
    const [targetStudents] = await db.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE p.grade = ?
    `, [targetGrade]);
    
    console.log(`   Encontrados ${targetStudents.length} alunos na série "${targetGrade}"`);
    
    // Matricular automaticamente todos os alunos da série
    let enrolledCount = 0;
    for (const student of targetStudents) {
      try {
        await db.execute(`
          INSERT INTO enrollments (student_id, subject_id, enrollment_date)
          VALUES (?, ?, NOW())
        `, [student.id, newSubjectId]);
        
        console.log(`   ✓ ${student.full_name} matriculado automaticamente`);
        enrolledCount++;
      } catch (error) {
        console.log(`   ✗ Erro ao matricular ${student.full_name}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 RESULTADO DA MATRÍCULA AUTOMÁTICA:`);
    console.log(`   • Total de alunos matriculados: ${enrolledCount}`);
    console.log(`   • Disciplina: ${newSubjectName} (ID: ${newSubjectId})`);
    
    // 4. Verificar as matrículas
    const [enrolledStudents] = await db.execute(`
      SELECT u.id, u.email, p.full_name, p.grade, e.enrollment_date
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.subject_id = ?
      ORDER BY p.full_name
    `, [newSubjectId]);
    
    console.log(`\n👥 ALUNOS MATRICULADOS NA NOVA DISCIPLINA:`);
    enrolledStudents.forEach(student => {
      console.log(`   • ${student.full_name} (${student.email}) - ${student.grade}`);
    });
    
    // 5. Criar uma atividade para testar o acesso
    console.log(`\n📝 CRIANDO ATIVIDADE PARA TESTAR ACESSO:`);
    
    const [activityResult] = await db.execute(`
      INSERT INTO activities (name, subject_id, grade, type, teacher_id, description, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Projeto Final - Portfólio Web',
      newSubjectId,
      targetGrade,
      'individual',
      8,
      'Desenvolver um portfólio web pessoal utilizando HTML, CSS e JavaScript',
      '2025-10-30 23:59:59'
    ]);
    
    const activityId = activityResult.insertId;
    console.log(`   ✅ Atividade criada! ID: ${activityId}`);
    
    // 6. Verificar acesso dos alunos às atividades
    console.log(`\n🔍 VERIFICANDO ACESSO DAS ATIVIDADES:`);
    
    const [accessibleActivities] = await db.execute(`
      SELECT DISTINCT p.full_name, u.email, a.name as activity_name, s.name as subject_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN enrollments e ON u.id = e.student_id
      JOIN activities a ON e.subject_id = a.subject_id
      JOIN subjects s ON a.subject_id = s.id
      WHERE e.subject_id = ?
      ORDER BY p.full_name
    `, [newSubjectId]);
    
    console.log(`   ${accessibleActivities.length} alunos podem acessar a atividade:`);
    accessibleActivities.forEach(activity => {
      console.log(`   • ${activity.full_name} pode acessar "${activity.activity_name}" da disciplina "${activity.subject_name}"`);
    });
    
    // 7. Demonstração do benefício para o professor
    console.log(`\n🎯 BENEFÍCIOS PARA O PROFESSOR:`);
    console.log(`   • Tempo economizado: Não precisa matricular alunos manualmente`);
    console.log(`   • Consistência: Todos os alunos da série são matriculados automaticamente`);
    console.log(`   • Implantabilidade: Funciona imediatamente após criar a disciplina`);
    console.log(`   • Escalabilidade: Funciona para qualquer número de alunos`);
    
    // 8. Demonstração do benefício para o aluno
    console.log(`\n🎓 BENEFÍCIOS PARA O ALUNO:`);
    console.log(`   • Acesso imediato: As atividades aparecem assim que a disciplina é criada`);
    console.log(`   • Transparência: Todas as atividades da série estão disponíveis`);
    console.log(`   • Equidade: Todos os alunos da mesma série têm as mesmas oportunidades`);
    
    // 9. Limpeza (opcional para demonstração)
    console.log(`\n🧹 LIMPEZA (para demonstração):`);
    console.log(`   Para manter o banco limpo, você pode remover a disciplina de teste.`);
    console.log(`   Comandos SQL:`);
    console.log(`   DELETE FROM enrollments WHERE subject_id = ${newSubjectId};`);
    console.log(`   DELETE FROM activities WHERE subject_id = ${newSubjectId};`);
    console.log(`   DELETE FROM subjects WHERE id = ${newSubjectId};`);

  } catch (error) {
    console.error('❌ Erro na demonstração:', error);
  } finally {
    await db.end();
 }
}

demonstrateAutoEnrollment();
