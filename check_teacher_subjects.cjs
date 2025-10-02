const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTeacherSubjects() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('=== Verificando tabelas relacionadas ===');
    
    // Verificar se o professor existe
    const [teachers] = await connection.execute(`
      SELECT u.id, u.email, p.full_name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'teacher'
    `);
    console.log('Professores encontrados:', teachers);
    
    // Verificar disciplinas existentes
    const [subjects] = await connection.execute(`
      SELECT s.*, p.full_name as teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
    `);
    console.log('Disciplinas encontradas:', subjects);
    
    // Verificar tabela teacher_subjects
    const [teacherSubjects] = await connection.execute(`
      SELECT * FROM teacher_subjects
    `);
    console.log('Associações professor-disciplina:', teacherSubjects);
    
    // Verificar o professor específico com ID 8
    console.log('\n=== Verificando professor ID 8 ===');
    const [prof8] = await connection.execute(`
      SELECT u.id, u.email, p.full_name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = 8
    `);
    console.log('Professor ID 8:', prof8);
    
    // Verificar disciplinas diretamente associadas ao professor ID 8
    const [subjectsWithTeacher8] = await connection.execute(`
      SELECT s.*, p.full_name as teacher_name
      FROM subjects s
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      WHERE s.teacher_id = 8
    `);
    console.log('Disciplinas com teacher_id = 8:', subjectsWithTeacher8);
    
    // Verificar associações na tabela teacher_subjects para professor ID 8
    const [assocWithTeacher8] = await connection.execute(`
      SELECT ts.*, s.name as subject_name, p.full_name as teacher_name
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      WHERE ts.teacher_id = 8
    `);
    console.log('Associações para professor ID 8:', assocWithTeacher8);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTeacherSubjects();
