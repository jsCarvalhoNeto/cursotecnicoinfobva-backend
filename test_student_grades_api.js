import fetch from 'node-fetch';

async function testStudentGradesAPI() {
  try {
    console.log('Testando API de notas de atividades do aluno...');
    
    // Testar com um cookie de sessão (você precisará substituir pelo cookie real de um aluno autenticado)
    const response = await fetch('http://localhost:4002/api/activities/student/grades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log('Erro:', error);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

testStudentGradesAPI();
