import axios from 'axios';

// Configurar axios para manter cookies
const api = axios.create({
  baseURL: 'http://localhost:4002',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function loginAsTeacher() {
  try {
    console.log('Fazendo login como professor...');
    const response = await api.post('/api/auth/login', {
      email: 'teacher@example.com', // email padrão de professor
      password: 'password123' // senha padrão
    });
    
    console.log('Login bem sucedido:', response.data);
    return response.data;
  } catch (error) {
    console.log('Erro no login:', error.response?.data || error.message);
    // Tentar com outro email comum de professor
    try {
      const response = await api.post('/api/auth/login', {
        email: 'admin@teacher.com',
        password: 'password123'
      });
      console.log('Login bem sucedido:', response.data);
      return response.data;
    } catch (error2) {
      console.log('Tentativa alternativa de login falhou:', error2.response?.data || error2.message);
      return null;
    }
  }
}

async function testGetActivityGrades() {
  try {
    console.log('Testando rota /api/activities/:id/grades...');
    
    // Primeiro fazer login para obter cookies de autenticação
    const loginResult = await loginAsTeacher();
    if (!loginResult) {
      console.log('Falha no login, tentando com requisição direta...');
      // Mesmo sem login, vamos ver se a rota existe
      try {
        const response = await api.get('/api/activities/1/grades');
        console.log('Status:', response.status);
        console.log('Resposta:', response.data);
      } catch (error) {
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Erro:', error.response.data);
          if (error.response.status === 404) {
            console.log('❌ Rota NÃO EXISTE - ainda retornando 404');
          } else {
            console.log('✅ Rota EXISTE - está apenas verificando autenticação (status:', error.response.status, ')');
          }
        }
      }
      return;
    }

    // Testar com activity ID 1
    const response = await api.get('/api/activities/1/grades');
    
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
      if (error.response.status === 404) {
        console.log('❌ Rota NÃO EXISTE - ainda retornando 404');
      } else {
        console.log('✅ Rota EXISTE - está apenas verificando autenticação (status:', error.response.status, ')');
      }
    } else {
      console.error('❌ Erro ao testar a rota:', error.message);
    }
  }
}

testGetActivityGrades();
