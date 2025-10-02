import axios from 'axios';

async function testTeacherPasswordChange() {
  try {
    console.log('Testando alteração de senha de professor...');

    // Testar com um ID de professor existente (vamos usar ID 8 como no erro original)
    const teacherId = '8';
    const newPassword = 'nova123senha';

    const response = await axios.put(`http://localhost:4002/api/teachers/${teacherId}/password`, {
      newPassword: newPassword
    });

    console.log('Resposta do servidor:', response.data);
    console.log('Status:', response.status);
    console.log('Alteração de senha realizada com sucesso!');
  } catch (error) {
    console.error('Erro na requisição:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testTeacherPasswordChange();
