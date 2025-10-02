import fetch from 'node-fetch';

async function testStudentGradesEndpoint() {
  try {
    console.log('Testando endpoint de notas das atividades do aluno...');
    
    // Testar com um cookie de sessão (você precisará substituir isso com um cookie real de aluno autenticado)
    const response = await fetch('http://localhost:4002/api/activities/student/grades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Endpoint de notas do aluno funcionando corretamente!');
      console.log('Número de notas retornadas:', data.length);
    } else {
      console.log('❌ Erro no endpoint:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Executar o teste
testStudentGradesEndpoint();
