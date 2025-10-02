const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSubjectGrade() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portal_escolar_balbina'
  });

  console.log('Atualizando a disciplina HTML (ID: 2) para ter série "1º Ano"...');
  
  const [result] = await connection.execute(
    'UPDATE subjects SET grade = ? WHERE id = ?',
    ['1º Ano', 2]
  );

  console.log('Resultado da atualização:', result);

  // Verificar se a atualização foi bem-sucedida
  const [check] = await connection.execute(
    'SELECT id, name, grade FROM subjects WHERE id = ?',
    [2]
  );

  console.log('Disciplina após atualização:');
  console.log(`- ${check[0].id}: ${check[0].name} (série: ${check[0].grade || 'não definida'})`);

  await connection.end();
}

updateSubjectGrade().catch(console.error);
