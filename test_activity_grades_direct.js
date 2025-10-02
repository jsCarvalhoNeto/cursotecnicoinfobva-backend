const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testActivityGrades() {
  try {
    console.log('Testando rota /api/activities/5/grades com cookie de sessão...');
    
    // Testar com o ID do professor existente (ID: 8)
    const response = await fetch('http://localhost:4002/api/activities/5/grades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sessionId=8'  // Simulando que o professor ID 8 está logado
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
    if (response.status === 200) {
      console.log('✅ Sucesso: Notas da atividade retornadas corretamente');
      console.log('Quantidade de submissões:', data.length);
    } else if (response.status === 401) {
      console.log('❌ Não autenticado - verifique se o cookie sessionId está correto');
    } else if (response.status === 403) {
      console.log('❌ Acesso negado - verifique se o usuário é professor e dono da atividade');
    } else if (response.status === 404) {
      console.log('❌ Atividade não encontrada - verifique se a atividade ID 5 existe');
    } else {
      console.log('❌ Erro inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('Erro ao testar rota:', error);
  }
}

testActivityGrades();
