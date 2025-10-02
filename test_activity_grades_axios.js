import axios from 'axios';

async function testActivityGrades() {
  try {
    console.log('Testando rota /api/activities/5/grades com cookie de sessão...');
    
    // Criar uma instância do axios com configuração para manter cookies
    const api = axios.create({
      baseURL: 'http://localhost:4002',
      withCredentials: true,
      headers: {
        'Cookie': 'sessionId=8'  // Simulando que o professor ID 8 está logado
      }
    });

    const response = await api.get('/api/activities/5/grades');
    
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);
    
    if (response.status === 200) {
      console.log('✅ Sucesso: Notas da atividade retornadas corretamente');
      console.log('Quantidade de submissões:', response.data.length);
    } else {
      console.log('❌ Erro inesperado:', response.status);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data);
      if (error.response.status === 401) {
        console.log('❌ Não autenticado - verifique se o cookie sessionId está correto');
      } else if (error.response.status === 403) {
        console.log('❌ Acesso negado - verifique se o usuário é professor e dono da atividade');
      } else if (error.response.status === 404) {
        console.log('❌ Atividade não encontrada - verifique se a atividade ID 5 existe');
      } else if (error.response.status === 500) {
        console.log('❌ Erro interno do servidor - verifique o log do servidor');
      }
    } else {
      console.error('Erro ao testar rota:', error.message);
    }
  }
}

testActivityGrades();
