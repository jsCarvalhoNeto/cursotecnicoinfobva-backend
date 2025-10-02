import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testTeacherRole() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'informatica_wave'
  });

  try {
    console.log('=== Testando papel de professor ===');
    
    // Verificar se o professor ID 8 realmente tem o papel de professor
    const [teacherRoles] = await db.execute(`
      SELECT ur.role 
      FROM user_roles ur 
      WHERE ur.user_id = ?
    `, [8]);
    
    console.log(`Papéis do professor ID 8:`, teacherRoles);
    
    if (teacherRoles.length === 0) {
      console.log('❌ Professor ID 8 não tem nenhum papel atribuído!');
    } else {
      const hasTeacherRole = teacherRoles.some(role => role.role === 'teacher');
      console.log(`Tem papel de professor: ${hasTeacherRole ? '✅ SIM' : '❌ NÃO'}`);
    }

    // Verificar informações completas do professor
    const [teacherInfo] = await db.execute(`
      SELECT u.id, u.email, p.full_name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
    `, [8]);
    
    console.log('\nInformações completas do professor ID 8:');
    console.log(teacherInfo);

    // Testar a query exata usada no createActivity
    console.log('\n=== Testando a query exata do createActivity ===');
    const [teacherCheck] = await db.execute(`
      SELECT user_id FROM user_roles WHERE user_id = ? AND role = "teacher"
    `, [8]);
    
    console.log(`Resultado da verificação de professor:`, teacherCheck.length > 0 ? '✅ É professor' : '❌ Não é professor');

    // Testar a query de verificação de disciplina
    console.log('\n=== Testando a query de verificação de disciplina ===');
    const [subjectCheck] = await db.execute(`
      SELECT s.id, s.grade as subject_grade
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE s.id = ? AND ts.teacher_id = ?
    `, [19, 8]); // Testando com a nova disciplina
    
    console.log(`Resultado da verificação de disciplina:`, subjectCheck.length > 0 ? '✅ Disciplina encontrada e pertence ao professor' : '❌ Disciplina não encontrada ou não pertence ao professor');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.end();
 }
}

testTeacherRole();
