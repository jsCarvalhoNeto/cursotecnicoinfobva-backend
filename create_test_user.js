import axios from 'axios';

async function createTestUser() {
  try {
    const response = await axios.post('http://localhost:4002/api/auth/register', {
      email: 'admin@test.com',
      password: 'admin123',
      fullName: 'Admin User'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Usuário criado com sucesso:', response.data);
  } catch (error) {
    console.error('Erro ao criar usuário:', error.response?.data || error.message);
  }
}

createTestUser();
