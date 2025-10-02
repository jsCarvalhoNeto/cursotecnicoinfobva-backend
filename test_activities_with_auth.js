const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testActivitiesWithAuth() {
  try {
    console.log('Testando rota de atividades do professor com autenticação...');
    
    // Primeiro, vamos tentar simular uma requisição com cookie de sessão
    // (Isso simula o comportamento do navegador quando o usuário está logado)
    const response = await fetch('http://localhost:4001/api/activities/teacher/8', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sessionId=8'  // Simulando que o usuário ID 8 está logado
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
    if (response.status === 200) {
      console.log('✅ Sucesso: Atividades do professor retornadas corretamente');
      console.log('Quantidade de atividades:', data.length);
      if (data.length === 0) {
        console.log('ℹ️  Nenhuma atividade encontrada (normal se o professor ainda não criou nenhuma)');
      }
    } else if (response.status === 401) {
      console.log('❌ Não autenticado - verifique se o cookie sessionId está correto');
    } else if (response.status === 403) {
      console.log('❌ Acesso negado - verifique se o usuário é professor');
    } else {
      console.log('❌ Erro inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('Erro ao testar rota:', error);
  }
}

testActivitiesWithAuth();
