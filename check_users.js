import mysql from 'mysql2/promise';

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'josedo64_sisctibalbina'
  });

  try {
    console.log('Verificando usuários existentes...');

    // Verificar todos os usuários
    const [users] = await connection.execute(`
      SELECT id, email, created_at
      FROM users
      ORDER BY id
    `);

    console.log('Usuários encontrados:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Criado em: ${user.created_at}`);
    });

    // Verificar papéis dos usuários
    const [roles] = await connection.execute(`
      SELECT ur.user_id, ur.role, u.email
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      ORDER BY ur.user_id
    `);

    console.log('\nPapéis dos usuários:');
    roles.forEach(role => {
      console.log(`User ID: ${role.user_id}, Role: ${role.role}, Email: ${role.email}`);
    });

    // Verificar professores específicos
    const [teachers] = await connection.execute(`
      SELECT ur.user_id, u.email, p.full_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE ur.role = 'teacher'
      ORDER BY ur.user_id
    `);

    console.log('\nProfessores encontrados:');
    teachers.forEach(teacher => {
      console.log(`Teacher ID: ${teacher.user_id}, Email: ${teacher.email}, Nome: ${teacher.full_name || 'N/A'}`);
    });

  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkUsers().catch(console.error);
