import fetch from 'node-fetch';

// Testar a nova rota de atividades para alunos
async function testStudentActivitiesRoute() {
  try {
    console.log('Testando rota de atividades para aluno...');
    
    // Simular um cookie de autenticação (você precisará substituir isso com um cookie real de aluno)
    const response = await fetch('http://localhost:4001/api/activities/student', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': 'session=seu_cookie_de_sessao_aqui' // Substitua com um cookie real
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
  } catch (error) {
    console.error('Erro ao testar rota:', error);
  }
}

testStudentActivitiesRoute();
