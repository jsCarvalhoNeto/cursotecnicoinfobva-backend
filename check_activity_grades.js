// Script para verificar atividades e notas no banco de dados
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkActivityGrades() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'curso_tecnico'
    });

    console.log('=== Verificando atividades ===\n');

    // Buscar todas as atividades com informações do professor
    const [activities] = await connection.execute(`
      SELECT a.id, a.name, a.teacher_id, u.email as teacher_email, p.full_name as teacher_name
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      ORDER BY a.id
    `);

    console.log('Atividades encontradas:');
    activities.forEach(activity => {
      console.log(`ID: ${activity.id}, Nome: ${activity.name}, Professor ID: ${activity.teacher_id}, Professor: ${activity.teacher_name} (${activity.teacher_email})`);
    });

    console.log('\n=== Verificando notas de atividades (activity_grades) ===\n');

    // Buscar todas as notas de atividades
    const [grades] = await connection.execute(`
      SELECT ag.id, ag.activity_id, ag.enrollment_id, ag.grade, ag.graded_by, 
             a.name as activity_name, a.teacher_id as activity_teacher_id,
             u.email as graded_by_email, p.full_name as graded_by_name
      FROM activity_grades ag
      LEFT JOIN activities a ON ag.activity_id = a.id
      LEFT JOIN users u ON ag.graded_by = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY ag.id
    `);

    console.log('Notas de atividades encontradas:');
    grades.forEach(grade => {
      console.log(`Grade ID: ${grade.id}, Activity ID: ${grade.activity_id}, Activity Teacher ID: ${grade.activity_teacher_id}, Grade: ${grade.grade}, Graded By: ${grade.graded_by_name} (${grade.graded_by_email})`);
    });

    console.log('\n=== Verificando nota específica (ID 5) ===\n');

    // Verificar a nota específica que está causando o problema
    const [specificGrade] = await connection.execute(`
      SELECT ag.id, ag.activity_id, ag.enrollment_id, ag.grade, ag.graded_by,
             a.teacher_id as activity_teacher_id,
             u.email as graded_by_email, p.full_name as graded_by_name,
             ut.email as activity_teacher_email, pt.full_name as activity_teacher_name
      FROM activity_grades ag
      JOIN activities a ON ag.activity_id = a.id
      LEFT JOIN users u ON ag.graded_by = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN users ut ON a.teacher_id = ut.id
      LEFT JOIN profiles pt ON ut.id = pt.user_id
      WHERE ag.id = 5
    `);

    if (specificGrade.length > 0) {
      const grade = specificGrade[0];
      console.log(`Nota ID 5:`);
      console.log(`  - Activity ID: ${grade.activity_id}`);
      console.log(`  - Activity Teacher ID: ${grade.activity_teacher_id}`);
      console.log(` - Activity Teacher: ${grade.activity_teacher_name} (${grade.activity_teacher_email})`);
      console.log(`  - Graded By: ${grade.graded_by_name} (${grade.graded_by_email})`);
      console.log(`  - Grade: ${grade.grade}`);
    } else {
      console.log('Nota com ID 5 não encontrada!');
    }

    await connection.end();
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar atividades e notas:', error);
  }
}

checkActivityGrades();
