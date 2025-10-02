const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCreateActivity() {
  try {
    console.log('Testando criação de atividade...');
    
    const activityData = {
      name: 'Teste de Atividade',
      subject_id: 1,  // Usando uma disciplina existente do professor
      grade: '1º Ano',
      type: 'individual'
    };

    const response = await fetch('http://localhost:4001/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sessionId=8'  // Simulando que o professor ID 8 está logado
      },
      body: JSON.stringify(activityData)
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
    if (response.status === 201) {
      console.log('✅ Sucesso: Atividade criada com sucesso');
    } else if (response.status === 400) {
      console.log('❌ Validação falhou - verifique os dados enviados');
    } else if (response.status === 403) {
      console.log('❌ Acesso negado - verifique se o usuário é professor e tem permissão');
    } else {
      console.log('❌ Erro inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('Erro ao testar criação de atividade:', error);
  }
}

testCreateActivity();
