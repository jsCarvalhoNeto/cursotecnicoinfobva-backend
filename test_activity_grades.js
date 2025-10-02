import axios from 'axios';

async function testGetActivityGrades() {
  try {
    console.log('Testando rota /api/activities/:id/grades...');
    
    // Testar com activity ID 1 (vou usar um ID existente)
    const response = await axios.get('http://localhost:4002/api/activities/1/grades', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
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

testGetActivityGrades();
