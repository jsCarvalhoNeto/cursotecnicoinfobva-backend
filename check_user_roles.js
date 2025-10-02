// Script para verificar papéis de usuários no banco de dados
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserRoles() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'curso_tecnico'
    });

    console.log('=== Verificando papéis de usuários ===\n');

    // Buscar todos os usuários com seus papéis
    const [users] = await connection.execute(`
      SELECT u.id, u.email, p.full_name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY u.id
    `);

    console.log('Usuários e seus papéis:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Nome: ${user.full_name}, Papel: ${user.role || 'NENHUM'}`);
    });

    console.log('\n=== Verificando professores (usuários com papel de teacher) ===\n');
    
    const [teachers] = await connection.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'teacher'
    `);

    console.log('Professores encontrados:');
    teachers.forEach(teacher => {
      console.log(`ID: ${teacher.id}, Email: ${teacher.email}, Nome: ${teacher.full_name}`);
    });

    console.log('\n=== Verificando alunos (usuários com papel de student) ===\n');
    
    const [students] = await connection.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
    `);

    console.log('Alunos encontrados:');
    students.forEach(student => {
      console.log(`ID: ${student.id}, Email: ${student.email}, Nome: ${student.full_name}`);
    });

    console.log('\n=== Verificando usuários sem papel atribuído ===\n');
    
    const [noRole] = await connection.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role IS NULL
    `);

    console.log('Usuários sem papel:');
    noRole.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Nome: ${user.full_name || 'N/A'}`);
    });

    await connection.end();
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar papéis de usuários:', error);
  }
}

checkUserRoles();
