import fetch from 'node-fetch';

const testAuthAndActivities = async () => {
 try {
    // Fazer login
    const loginRes = await fetch('http://localhost:4002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'professorsantosbva@gmail.com',
        password: 'senha123'
      })
    });

    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    if (loginData.success) {
      // Extrair o ID do usuário do login
      const userId = loginData.user.id;
      console.log('Login bem sucedido para professor ID:', userId);

      // Fazer requisição para o endpoint de atividades usando o cookie de sessão
      const gradesRes = await fetch('http://localhost:4002/api/activities/4/grades', {
        headers: {
          'Cookie': `sessionId=${userId}`
        }
      });

      console.log('Status do endpoint de atividades:', gradesRes.status);
      const gradesData = await gradesRes.json();
      console.log('Resposta do endpoint de atividades:', gradesData);

      if (gradesRes.status === 200) {
        console.log('✅ Endpoint de atividades funcionando corretamente com autenticação!');
      } else {
        console.log('❌ Erro no endpoint de atividades:', gradesData);
      }
    } else {
      console.log('❌ Falha no login:', loginData);
    }
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
  }
};

testAuthAndActivities();
