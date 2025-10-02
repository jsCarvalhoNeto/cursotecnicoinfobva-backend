const http = require('http');

function testApi() {
  console.log('Testando a API...');

 // Testar rota principal
 const options1 = {
    hostname: 'localhost',
    port: 4002,
    path: '/api',
    method: 'GET'
  };

  const req1 = http.request(options1, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('\n1. Rota principal (/api):');
      console.log('Status:', res.statusCode);
      console.log('Resposta:', data);
    });
  });

  req1.on('error', (error) => {
    console.error('Erro na requisição 1:', error);
 });

  req1.end();

  // Testar rota de atividades do aluno
 const options2 = {
    hostname: 'localhost',
    port: 4002,
    path: '/api/activities/student',
    method: 'GET'
  };

  const req2 = http.request(options2, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('\n2. Rota GET /api/activities/student:');
      console.log('Status:', res.statusCode);
      try {
        const jsonData = JSON.parse(data);
        console.log('Resposta:', jsonData);
      } catch {
        console.log('Resposta:', data);
      }
    });
  });

  req2.on('error', (error) => {
    console.error('Erro na requisição 2:', error);
  });

  req2.end();

  // Testar rota de envio de atividades do aluno
 const postData = JSON.stringify({});
  const options3 = {
    hostname: 'localhost',
    port: 4002,
    path: '/api/student-activities',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
 };

  const req3 = http.request(options3, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('\n3. Rota POST /api/student-activities:');
      console.log('Status:', res.statusCode);
      try {
        const jsonData = JSON.parse(data);
        console.log('Resposta:', jsonData);
      } catch {
        console.log('Resposta:', data);
      }
    });
  });

  req3.on('error', (error) => {
    console.error('Erro na requisição 3:', error);
  });

  req3.write(postData);
  req3.end();
}

testApi();
