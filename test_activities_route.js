const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testActivitiesRoute() {
  try {
    console.log('Testando rota de atividades do professor...');
    
    // Testar rota de atividades do professor (deve retornar 401 sem autenticação)
    const response = await fetch('http://localhost:4001/api/activities/teacher/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);
    
    if (response.status === 401) {
      console.log('✅ Esperado: Retornou 401 (não autenticado) - esta é a resposta correta sem token de autenticação');
    } else if (response.status === 200) {
      console.log('✅ Retornou 200 - Atividades do professor encontradas');
    } else {
      console.log('❌ Erro inesperado:', response.status);
    }
 } catch (error) {
    console.error('Erro ao testar rota:', error);
  }
}

testActivitiesRoute();
