import mysql from 'mysql2/promise';

async function testPeriodEvaluation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'josedo64_sisctibalbina'
  });

  try {
    console.log('Testando inserção de atividade com campos de período e tipo de avaliação...');

    // Inserir uma atividade de teste
    const [result] = await connection.execute(`
      INSERT INTO activities (name, subject_id, grade, type, teacher_id, period, evaluation_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Teste de Período e Avaliação',
      1, // subject_id
      '1º Ano', // grade
      'individual', // type
      8, // teacher_id (professor existente)
      '1º Período', // period
      'Avaliação Parcial', // evaluation_type
      'Atividade de teste para verificar campos de período e tipo de avaliação'
    ]);

    console.log('✅ Atividade inserida com sucesso! ID:', result.insertId);

    // Verificar a atividade inserida
    const [rows] = await connection.execute(`
      SELECT id, name, period, evaluation_type, description
      FROM activities 
      WHERE id = ?
    `, [result.insertId]);

    console.log('\nAtividade criada com sucesso:');
    console.log('ID:', rows[0].id);
    console.log('Nome:', rows[0].name);
    console.log('Período:', rows[0].period);
    console.log('Tipo de Avaliação:', rows[0].evaluation_type);
    console.log('Descrição:', rows[0].description);

    // Testar diferentes valores
    console.log('\nTestando diferentes combinações de valores...');

    // Testar 2º Período e Avaliação Global
    const [result2] = await connection.execute(`
      INSERT INTO activities (name, subject_id, grade, type, teacher_id, period, evaluation_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Teste 2º Período - Avaliação Global',
      1,
      '2º Ano',
      'team',
      8, // teacher_id (professor existente)
      '2º Período', // period
      'Avaliação Global', // evaluation_type
      'Teste com 2º Período e Avaliação Global'
    ]);

    console.log('✅ Segunda atividade inserida com sucesso! ID:', result2.insertId);

    // Testar 3º Período e Avaliação Parcial
    const [result3] = await connection.execute(`
      INSERT INTO activities (name, subject_id, grade, type, teacher_id, period, evaluation_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Teste 3º Período - Avaliação Parcial',
      1,
      '3º Ano',
      'individual',
      8, // teacher_id (professor existente)
      '3º Período', // period
      'Avaliação Parcial', // evaluation_type
      'Teste com 3º Período e Avaliação Parcial'
    ]);

    console.log('✅ Terceira atividade inserida com sucesso! ID:', result3.insertId);

    // Testar 4º Período e Avaliação Global
    const [result4] = await connection.execute(`
      INSERT INTO activities (name, subject_id, grade, type, teacher_id, period, evaluation_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Teste 4º Período - Avaliação Global',
      1,
      '3º Ano',
      'team',
      8, // teacher_id (professor existente)
      '4º Período', // period
      'Avaliação Global', // evaluation_type
      'Teste com 4º Período e Avaliação Global'
    ]);

    console.log('✅ Quarta atividade inserida com sucesso! ID:', result4.insertId);

    // Verificar todas as atividades criadas
    console.log('\nTodas as atividades de teste:');
    const [allRows] = await connection.execute(`
      SELECT id, name, period, evaluation_type, description
      FROM activities 
      WHERE id IN (?, ?, ?, ?)
      ORDER BY id
    `, [result.insertId, result2.insertId, result3.insertId, result4.insertId]);

    allRows.forEach((activity, index) => {
      console.log(`\nAtividade ${index + 1}:`);
      console.log('  ID:', activity.id);
      console.log(' Nome:', activity.name);
      console.log(' Período:', activity.period);
      console.log('  Tipo de Avaliação:', activity.evaluation_type);
      console.log('  Descrição:', activity.description);
    });

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('Erro no teste:', error);
    throw error;
  } finally {
    // Limpar os dados de teste
    try {
      await connection.execute(`
        DELETE FROM activities 
        WHERE name LIKE 'Teste de Período e Avaliação%' OR name LIKE 'Teste 2º Período%' OR name LIKE 'Teste 3º Período%' OR name LIKE 'Teste 4º Período%'
      `);
      console.log('\n🧹 Dados de teste limpos com sucesso!');
    } catch (cleanupError) {
      console.error('Erro ao limpar dados de teste:', cleanupError);
    }
    await connection.end();
  }
}

testPeriodEvaluation().catch(console.error);
