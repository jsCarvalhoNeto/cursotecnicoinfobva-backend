import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testActivityCreation() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Testando criação de atividade para nova disciplina ===');
    
    // Testar a query exata usada no createActivity para verificar permissões
    const subjectId = 19; // Nova disciplina "Gestão de Startup"
    const teacherId = 8;  // Professor ID
    
    console.log(`Testando permissão para professor ${teacherId} criar atividade para disciplina ${subjectId}`);
    
    // Testar a query de verificação de disciplina (mesma usada no controller)
    const [subjectResult] = await db.execute(`
      SELECT s.id, s.grade as subject_grade
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE s.id = ? AND ts.teacher_id = ?
    `, [subjectId, teacherId]);
    
    console.log(`Resultado da verificação de permissão: ${subjectResult.length > 0 ? '✅ PERMITIDO' : '❌ NEGADO'}`);
    
    if (subjectResult.length > 0) {
      console.log(`Disciplina encontrada: ID ${subjectResult[0].id}, Série: ${subjectResult[0].subject_grade}`);
      
      // Testar também a série da disciplina
      const [subjectInfo] = await db.execute(`
        SELECT s.name, s.grade, s.teacher_id
        FROM subjects s
        WHERE s.id = ?
      `, [subjectId]);
      
      console.log(`Informações da disciplina:`, subjectInfo[0]);
      
      // Verificar a associação em teacher_subjects
      const [association] = await db.execute(`
        SELECT * FROM teacher_subjects WHERE subject_id = ? AND teacher_id = ?
      `, [subjectId, teacherId]);
      
      console.log(`Associação encontrada em teacher_subjects:`, association.length > 0 ? '✅ SIM' : '❌ NÃO');
      
      if (association.length > 0) {
        console.log(`Associação detalhada:`, association[0]);
      }
    } else {
      console.log('❌ Disciplina não encontrada ou não pertence ao professor');
      
      // Verificar detalhes da disciplina
      const [subjectInfo] = await db.execute(`
        SELECT s.name, s.grade, s.teacher_id
        FROM subjects s
        WHERE s.id = ?
      `, [subjectId]);
      
      console.log(`Informações da disciplina:`, subjectInfo.length > 0 ? subjectInfo[0] : 'Disciplina não encontrada');
      
      // Verificar associação em teacher_subjects
      const [assocCheck] = await db.execute(`
        SELECT * FROM teacher_subjects WHERE subject_id = ?
      `, [subjectId]);
      
      console.log(`Associações existentes para esta disciplina:`, assocCheck);
    }

    console.log('\n=== Testando com outras disciplinas para comparação ===');
    
    const testSubjects = [1, 2, 19]; // Lógica de Programação, HTML, Gestão de Startup
    
    for (const testSubjectId of testSubjects) {
      const [testResult] = await db.execute(`
        SELECT s.name, s.grade, s.teacher_id
        FROM subjects s
        WHERE s.id = ?
      `, [testSubjectId]);
      
      const [permissionCheck] = await db.execute(`
        SELECT s.id
        FROM subjects s
        JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE s.id = ? AND ts.teacher_id = ?
      `, [testSubjectId, teacherId]);
      
      console.log(`Disciplina ${testSubjectId} (${testResult[0]?.name}): Permissão ${permissionCheck.length > 0 ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await db.end();
 }
}

testActivityCreation();
