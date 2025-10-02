import axios from 'axios';

// Configurar axios para manter cookies
const api = axios.create({
  baseURL: 'http://localhost:4002',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
 }
});

async function testFinalActivityGrades() {
  try {
    console.log('Testando a nova implementação de Activity Grades...');
    
    // Testar com activity ID 1 (vamos ver o que retorna)
    const response = await api.get('/api/activities/1/grades', {
      // Não estamos autenticados, então esperamos 401
    });
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Nova rota de activity grades funcionando corretamente!');
      console.log('Submissões retornadas:', response.data.length);
      if (response.data.length > 0) {
        console.log('Primeira submissão:', {
          aluno: response.data[0].student_name_display,
          email: response.data[0].student_email,
          status: response.data[0].status,
          arquivo: response.data[0].file_name,
          nota: response.data[0].grade
        });
      }
    } else {
      console.log('❌ Erro:', response.data.error);
    }
 } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data);
      if (error.response.status === 401) {
        console.log('✅ Rota existe e está verificando autenticação corretamente');
      } else if (error.response.status === 404) {
        console.log('❌ Rota NÃO EXISTE');
      } else {
        console.log('❌ Outro erro:', error.response.data.error);
      }
    } else {
      console.error('❌ Erro de rede:', error.message);
    }
  }
}

// Testar também a rota de alunos por disciplina
async function testStudentsBySubject() {
  try {
    console.log('\nTestando rota de alunos por disciplina...');
    
    const response = await api.get('/api/subjects/2/students', {
      // Não estamos autenticados, então esperamos 401
    });
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Rota de alunos por disciplina funcionando!');
      console.log('Alunos retornados:', response.data.length);
    } else {
      console.log('❌ Erro:', response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data);
      if (error.response.status === 401) {
        console.log('✅ Rota existe e está verificando autenticação corretamente');
      } else if (error.response.status === 404) {
        console.log('❌ Rota NÃO EXISTE');
      } else {
        console.log('❌ Outro erro:', error.response.data.error);
      }
    } else {
      console.error('❌ Erro de rede:', error.message);
    }
  }
}

testFinalActivityGrades();
testStudentsBySubject();
