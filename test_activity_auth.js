import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testActivityAuth() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Testando autorização para criação de atividades ===');
    
    // Vamos testar com diferentes combinações de subject_id e teacher_id
    const testCases = [
      { subject_id: 1, teacher_id: 8 },
      { subject_id: 2, teacher_id: 8 },
      { subject_id: 19, teacher_id: 8 }, // A nova disciplina
      { subject_id: 1, teacher_id: 9 },  // Professor errado
      { subject_id: 999, teacher_id: 8 } // Disciplina inexistente
    ];

    for (const testCase of testCases) {
      console.log(`\nTestando: subject_id=${testCase.subject_id}, teacher_id=${testCase.teacher_id}`);
      
      const [result] = await db.execute(`
        SELECT s.id, s.grade as subject_grade
        FROM subjects s
        JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE s.id = ? AND ts.teacher_id = ?
      `, [testCase.subject_id, testCase.teacher_id]);
      
      console.log(`  Resultado: ${result.length} registros encontrados`);
      if (result.length > 0) {
        console.log(`  ✅ Permissão concedida - ${result[0].id} (${result[0].subject_grade})`);
      } else {
        console.log(`  ❌ Permissão negada - Nenhuma correspondência encontrada`);
      }
    }

    // Vamos também verificar se existem associações diretas em subjects.teacher_id
    console.log('\n=== Verificando permissões via subjects.teacher_id ===');
    for (const testCase of testCases) {
      console.log(`\nTestando via subjects.teacher_id: subject_id=${testCase.subject_id}, teacher_id=${testCase.teacher_id}`);
      
      const [result] = await db.execute(`
        SELECT s.id, s.grade as subject_grade
        FROM subjects s
        WHERE s.id = ? AND s.teacher_id = ?
      `, [testCase.subject_id, testCase.teacher_id]);
      
      console.log(`  Resultado: ${result.length} registros encontrados`);
      if (result.length > 0) {
        console.log(`  ✅ Permissão concedida via subjects.teacher_id`);
      } else {
        console.log(`  ❌ Permissão negada via subjects.teacher_id`);
      }
    }

 } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

testActivityAuth();
