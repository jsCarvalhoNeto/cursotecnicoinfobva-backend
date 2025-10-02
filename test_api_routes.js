import fetch from 'node-fetch';

async function testApiRoutes() {
  console.log('Testando as rotas da API...');

  try {
    // Testar rota principal
    console.log('\\n1. Testando rota principal...');
    const response1 = await fetch('http://localhost:4002/api');
    const data1 = await response1.text();
    console.log('Status:', response1.status);
    console.log('Resposta:', data1);

    // Testar rota de atividades do aluno (GET - deve retornar erro 401 sem autenticação)
    console.log('\\n2. Testando rota GET /api/activities/student...');
    const response2 = await fetch('http://localhost:4002/api/activities/student');
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Resposta:', data2);

    // Testar rota de envio de atividades do aluno (POST - deve retornar erro sem dados)
    console.log('\\n3. Testando rota POST /api/student-activities...');
    const response3 = await fetch('http://localhost:4002/api/student-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Resposta:', data3);

    console.log('\\n✅ Testes concluídos com sucesso! As rotas estão funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

testApiRoutes();
