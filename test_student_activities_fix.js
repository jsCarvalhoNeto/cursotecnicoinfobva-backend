import fetch from 'node-fetch';

// Teste para verificar se as atividades do aluno estão sendo retornadas corretamente
async function testStudentActivities() {
  try {
    // Simular uma sessão de aluno (você precisará substituir pelo ID real de um aluno logado)
    console.log('Testando rota de atividades para alunos...');
    
    // Este é um teste de integração - você precisará de um aluno autenticado
    // para testar a rota completa
    const response = await fetch('http://localhost:4001/api/activities/student', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': 'sessionId=1' // Isso é apenas para demonstração
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Teste para verificar a rota de atividades por disciplina para alunos
async function testSubjectActivities() {
  try {
    console.log('\nTestando rota de atividades por disciplina para alunos...');
    
    const response = await fetch('http://localhost:4001/api/activities/subject/1', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': 'sessionId=2' // Isso é apenas para demonstração
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar testes
testStudentActivities();
testSubjectActivities();
