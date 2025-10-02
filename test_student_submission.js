import fetch from 'node-fetch';

// Teste para verificar o envio de atividades do aluno
async function testStudentSubmission() {
  try {
    console.log('Testando envio de atividade do aluno...');

    // Simular um aluno autenticado (você precisará substituir pelo ID real de um aluno logado)
    const formData = new FormData();
    formData.append('activity_id', '1'); // ID da atividade existente
    formData.append('student_name', 'João Silva'); // Nome do aluno
    formData.append('team_members', 'Maria Souza\nPedro Costa'); // Membros da equipe (se for atividade em equipe)

    // Criar um arquivo de teste (simulado)
    const fileContent = new Blob(['Conteúdo do teste da atividade'], { type: 'text/plain' });
    const file = new File([fileContent], 'atividade_teste.txt', { type: 'text/plain' });
    formData.append('file', file);

    const response = await fetch('http://localhost:4001/api/student-activities', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cookie': 'sessionId=1' // Isso é apenas para demonstração
      },
      body: formData
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);

    if (response.ok) {
      console.log('✅ Envio de atividade do aluno funcionando corretamente!');
    } else {
      console.log('❌ Erro no envio da atividade:', data.error);
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Teste para verificar a busca de atividades do aluno
async function testGetStudentActivities() {
  try {
    console.log('\nTestando busca de atividades para aluno...');

    const response = await fetch('http://localhost:4001/api/activities/student', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': 'sessionId=1' // Isso é apenas para demonstração
      }
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Atividades do aluno:', data);

    if (response.ok) {
      console.log('✅ Busca de atividades do aluno funcionando corretamente!');
    } else {
      console.log('❌ Erro na busca de atividades:', data.error);
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar testes
console.log('Iniciando testes...');
testStudentSubmission();
testGetStudentActivities();
