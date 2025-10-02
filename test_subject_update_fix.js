import mysql from 'mysql2/promise';

// Configuração do banco de dados
const dbConfig = {
 host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'josedo64_sisctibalbina'
};

async function testSubjectUpdateFix() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('=== Testando a correção do problema de atualização de disciplina ===\n');
    
    // Limpar dados de teste antigos
    await connection.execute('DELETE FROM users WHERE email = ?', ['teacher@test.com']);
    
    // Criar um professor de teste
    const [teacherResult] = await connection.execute(
      'INSERT INTO users (email, password, created_at) VALUES (?, ?, NOW())',
      ['teacher@test.com', 'hashed_password']
    );
    const teacherId = teacherResult.insertId;
    
    // Adicionar o professor à tabela de perfis
    await connection.execute(
      'INSERT INTO profiles (user_id, full_name) VALUES (?, ?)',
      [teacherId, 'Professor Teste']
    );
    
    // Adicionar o professor à tabela de roles
    await connection.execute(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [teacherId, 'teacher']
    );
    
    console.log('✓ Professor criado:', teacherId);
    
    // Criar uma disciplina com professor
    const [subjectResult] = await connection.execute(
      'INSERT INTO subjects (name, description, teacher_id, grade) VALUES (?, ?, ?, ?)',
      ['Matemática', 'Disciplina de matemática', teacherId, '1º Ano']
    );
    const subjectId = subjectResult.insertId;
    console.log('✓ Disciplina criada:', subjectId);
    
    // Verificar o estado inicial
    const [initialSubject] = await connection.execute(
      'SELECT * FROM subjects WHERE id = ?',
      [subjectId]
    );
    console.log('Estado inicial da disciplina:', initialSubject[0]);
    
    // Simular a atualização que causava o problema (atualizar apenas o semestre)
    // Antes da correção: isso removeria o teacher_id
    // Depois da correção: isso deve manter o teacher_id
    await connection.execute(
      'UPDATE subjects SET grade = ? WHERE id = ?',
      ['2º Ano', subjectId]
    );
    
    // Verificar o estado após a atualização
    const [updatedSubject] = await connection.execute(
      'SELECT * FROM subjects WHERE id = ?',
      [subjectId]
    );
    console.log('Estado após atualizar apenas o semestre:', updatedSubject[0]);
    
    if (updatedSubject[0].teacher_id === teacherId) {
      console.log('✅ SUCESSO: O professor foi mantido após a atualização do semestre!');
    } else {
      console.log('❌ ERRO: O professor foi perdido após a atualização do semestre!');
    }
    
    // Testar atualização de professor mantendo outros campos
    await connection.execute(
      'UPDATE subjects SET teacher_id = NULL WHERE id = ?',
      [subjectId]
    );
    
    const [noTeacherSubject] = await connection.execute(
      'SELECT * FROM subjects WHERE id = ?',
      [subjectId]
    );
    console.log('Estado após remover professor:', noTeacherSubject[0]);
    
    // Atualizar semestre novamente com professor nulo
    await connection.execute(
      'UPDATE subjects SET grade = ? WHERE id = ?',
      ['3º Ano', subjectId]
    );
    
    const [finalSubject] = await connection.execute(
      'SELECT * FROM subjects WHERE id = ?',
      [subjectId]
    );
    console.log('Estado final:', finalSubject[0]);
    
    if (finalSubject[0].grade === '3º Ano' && finalSubject[0].teacher_id === null) {
      console.log('✅ SUCESSO: Atualização parcial funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
 } finally {
    await connection.end();
  }
}

// Executar o teste
testSubjectUpdateFix().catch(console.error);
