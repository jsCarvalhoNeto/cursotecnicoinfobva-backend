const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
  try {
    const response = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hudsondasilva@gmail.com',
        password: 'CCD5jR3#Ygm@'
      })
    });
    
    const result = await response.json();
    console.log('Resposta da API:', result);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

testLogin();
