import axios from 'axios';

// Configurar axios para manter cookies
const api = axios.create({
  baseURL: 'http://localhost:4002',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function testDeleteActivity() {
  try {
    console.log('Testando exclusão de atividade...');
    
    // Testar exclusão de uma atividade específica (usando ID 1 como exemplo)
    const response = await api.delete('/api/activities/1');
    
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);
    
    if (response.status === 200) {
      console.log('✅ Exclusão de atividade funcionando corretamente!');
    } else {
      console.log('❌ Erro:', response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data);
      if (error.response.status === 401) {
        console.log('✅ Rota existe e está verificando autenticação corretamente');
      } else if (error.response.status === 404) {
        console.log('❌ Atividade não encontrada');
      } else if (error.response.status === 403) {
        console.log('❌ Acesso negado - não é professor ou atividade não pertence ao professor');
      } else {
        console.log('❌ Outro erro:', error.response.data.error);
      }
    } else {
      console.error('❌ Erro de rede:', error.message);
    }
  }
}

// Testar também se a rota de exclusão existe
async function testDeleteRouteExists() {
  try {
    console.log('\nTestando se a rota de exclusão de atividade existe...');
    
    // Fazer uma requisição OPTIONS para verificar se a rota existe
    const response = await api.options('/api/activities/1');
    
    console.log('Status OPTIONS:', response.status);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      if (error.response.status === 405) {
        console.log('✅ Rota de exclusão de atividade existe (método DELETE não permitido via OPTIONS)');
      } else {
        console.log('❌ Rota de exclusão de atividade pode não existir:', error.response.status);
      }
    } else {
      console.log('Possível erro de rede ou rota não existe');
    }
 }
}

testDeleteActivity();
testDeleteRouteExists();
