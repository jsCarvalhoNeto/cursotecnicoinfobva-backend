// Script para testar a atualização de nota diretamente
import fetch from 'node-fetch';

async function testGradeUpdate() {
  // Simular um cookie de sessão - você precisará substituir pelo ID real do professor
  // De acordo com nosso check_user_roles.js, o professor ID 8 é o que tem email professorsantosbva@gmail.com
 const sessionId = 8; // ID do professor que criou a atividade
  
  // Criar um cookie de sessão simulado
  const cookie = `sessionId=${sessionId}`;
  
  console.log('Testando atualização de nota com sessão:', cookie);
  console.log('Tentando atualizar nota ID 5 para a nota 8.5...\n');

  try {
    const response = await fetch('http://localhost:4002/api/activities/activity-grades/5', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({ 
        grade: 8.5,
        status: 'graded',
        feedback: 'Bom trabalho!'
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', result);
    
    if (response.status === 403) {
      console.log('\nERRO 403 detectado - verifique os logs do servidor para mais detalhes');
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

testGradeUpdate();
