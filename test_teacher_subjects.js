import axios from 'axios';

async function testTeacherSubjects() {
  try {
    console.log('Testando rota /api/teachers/:id/subjects...');
    
    // Testar com o ID correto do professor (8)
    const response = await axios.get('http://localhost:4001/api/teachers/8/subjects');
    console.log('Resposta da API:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.log('Erro (o que é esperado se não houver professor com ID 1):', error.response?.data || error.message);
  }

  try {
    // Testar com um ID inválido para verificar a validação
    console.log('\nTestando com ID inválido...');
    const response = await axios.get('http://localhost:4001/api/teachers/abc/subjects');
    console.log('Resposta da API:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.log('Erro com ID inválido (esperado):', error.response?.data || error.message);
  }

  try {
    // Testar com ID numérico inválido
    console.log('\nTestando com ID numérico que não existe...');
    const response = await axios.get('http://localhost:4001/api/teachers/9999/subjects');
    console.log('Resposta da API:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.log('Erro com ID não existente:', error.response?.data || error.message);
  }
}

testTeacherSubjects();
