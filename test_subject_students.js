// Usando o fetch nativo do Node.js (disponível em versões mais recentes)
// ou usando axios se estiver disponível no projeto

// Vou usar o axios que já deve estar disponível no projeto
import axios from 'axios';

async function testGetStudentsBySubject() {
  try {
    console.log('Testando rota /api/subjects/:id/students...');
    
    // Testar com subject ID 2 (o mesmo do erro original)
    const response = await axios.get('http://localhost:4002/api/subjects/2/students');
    
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);
    
    if (response.status === 200) {
      console.log('✅ Rota funcionando corretamente!');
    } else {
      console.log('❌ Erro na rota:', response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data);
      console.log('❌ Erro na rota:', error.response.data.error);
    } else {
      console.error('❌ Erro ao testar a rota:', error.message);
    }
  }
}

testGetStudentsBySubject();
