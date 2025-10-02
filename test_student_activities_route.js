// Script para testar a rota de atividades do aluno
// Este script simula a chamada à nova rota com diferentes IDs de aluno

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testStudentActivitiesRoute() {
  console.log('Testando rota de atividades para alunos...\n');
  
  try {
    // Conectar ao banco de dados
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'curso_balbina'
    });

    // Obter alunos com papel 'student'
    const [students] = await connection.execute(`
      SELECT u.id, u.email, p.full_name 
      FROM users u 
      JOIN profiles p ON u.id = p.user_id 
      JOIN user_roles ur ON u.id = ur.user_id 
      WHERE ur.role = 'student'
    `);

    console.log('Alunos encontrados:', students);

    for (const student of students) {
      console.log(`\n--- Testando para aluno: ${student.full_name} (ID: ${student.id}) ---`);
      
      // Simular a lógica da função getActivitiesByStudent
      console.log('1. Verificando papéis do aluno...');
      const [roleResult] = await connection.execute(
        'SELECT role FROM user_roles WHERE user_id = ?', 
        [student.id]
      );
      console.log('   Papéis:', roleResult);
      
      const hasStudentRole = roleResult.some(role => role.role === 'student');
      console.log('   Tem papel de aluno:', hasStudentRole);

      if (hasStudentRole) {
        console.log('2. Buscando matrículas do aluno...');
        const [enrollmentsResult] = await connection.execute(`
          SELECT DISTINCT s.id as subject_id, s.name as subject_name, p.full_name as teacher_name
          FROM enrollments e
          JOIN subjects s ON e.subject_id = s.id
          JOIN users u ON s.teacher_id = u.id
          JOIN profiles p ON u.id = p.user_id
          WHERE e.student_id = ?
        `, [student.id]);
        
        console.log('   Matrículas encontradas:', enrollmentsResult);

        if (enrollmentsResult.length > 0) {
          const subjectIds = enrollmentsResult.map(enrollment => enrollment.subject_id);
          console.log('   IDs das disciplinas:', subjectIds);

          console.log('3. Buscando atividades para as disciplinas...');
          const activitiesQuery = `
            SELECT a.*, p.full_name as teacher_name, s.name as subject_name
            FROM activities a
            JOIN users u ON a.teacher_id = u.id
            JOIN profiles p ON u.id = p.user_id
            JOIN subjects s ON a.subject_id = s.id
            WHERE a.subject_id IN (${subjectIds.map(() => '?').join(',')})
            ORDER BY a.created_at DESC
          `;
          const [activitiesResult] = await connection.execute(activitiesQuery, subjectIds);
          
          console.log('   Atividades encontradas:', activitiesResult.length);
          console.log('   Atividades:', activitiesResult.map(a => ({
            id: a.id,
            name: a.name,
            subject: a.subject_name,
            teacher: a.teacher_name
          })));
        } else {
          console.log('   Nenhuma matrícula encontrada para este aluno');
        }
      } else {
        console.log('   Usuário não é aluno');
      }
    }

    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testStudentActivitiesRoute();
