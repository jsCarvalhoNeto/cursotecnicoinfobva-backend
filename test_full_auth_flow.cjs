const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFullAuthFlow() {
  try {
    console.log('=== Teste Completo de Fluxo de Autenticação ===');
    
    // Teste 1: Login com credenciais corretas
    console.log('\n1. Testando login com credenciais CORRETAS...');
    const correctLoginResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hudsondasilva@gmail.com',
        password: 'CCD5jR3#Ygm@'
      })
    });
    
    const correctLoginResult = await correctLoginResponse.json();
    console.log('Status:', correctLoginResponse.status);
    console.log('Resposta:', correctLoginResult);
    
    // Teste 2: Login com senha incorreta
    console.log('\n2. Testando login com SENHA INCORRETA...');
    const wrongPasswordResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hudsondasilva@gmail.com',
        password: 'senhaerrada'
      })
    });
    
    const wrongPasswordResult = await wrongPasswordResponse.json();
    console.log('Status:', wrongPasswordResponse.status);
    console.log('Resposta:', wrongPasswordResult);
    
    // Teste 3: Login com email que não existe
    console.log('\n3. Testando login com EMAIL QUE NÃO EXISTE...');
    const nonExistentEmailResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'naoexiste@gmail.com',
        password: 'qualquersenha'
      })
    });
    
    const nonExistentEmailResult = await nonExistentEmailResponse.json();
    console.log('Status:', nonExistentEmailResponse.status);
    console.log('Resposta:', nonExistentEmailResult);
    
    // Teste 4: Login sem campos obrigatórios
    console.log('\n4. Testando login SEM CAMPOS OBRIGATÓRIOS...');
    const missingFieldsResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '',
        password: ''
      })
    });
    
    const missingFieldsResult = await missingFieldsResponse.json();
    console.log('Status:', missingFieldsResponse.status);
    console.log('Resposta:', missingFieldsResult);

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testFullAuthFlow();
