import axios from 'axios';

// Teste para simular o cenário real da aplicação
async function testRealScenario() {
  console.log('=== Testando cenário real de atualização de disciplina ===\n');
  
  const baseURL = 'http://localhost:4002';
  
  try {
    // Simular login para obter token (você precisará ajustar isso com credenciais reais)
    // Para este teste, vou assumir que temos um token de admin
    
    // Primeiro, vamos buscar uma disciplina existente (você pode ajustar o ID)
    console.log('Buscando disciplinas existentes...');
    const subjectsResponse = await axios.get(`${baseURL}/api/subjects`);
    console.log('Disciplinas encontradas:', subjectsResponse.data.length);
    
    if (subjectsResponse.data.length > 0) {
      const subject = subjectsResponse.data[0];
      console.log('Disciplina original:', {
        id: subject.id,
        name: subject.name,
        teacher_name: subject.teacher_name,
        grade: subject.grade
      });
      
      // Simular atualização apenas do semestre (grade)
      console.log('\nAtualizando apenas o semestre...');
      const updateResponse = await axios.put(`${baseURL}/api/subjects/${subject.id}`, {
        grade: '2º Ano'  // Apenas atualizando o semestre
      });
      
      console.log('Resposta da atualização:', updateResponse.data);
      
      // Verificar se a disciplina foi atualizada corretamente
      const updatedSubjectResponse = await axios.get(`${baseURL}/api/subjects/${subject.id}`);
      const updatedSubject = updatedSubjectResponse.data;
      
      console.log('Disciplina após atualização:', {
        id: updatedSubject.id,
        name: updatedSubject.name,
        teacher_name: updatedSubject.teacher_name,
        grade: updatedSubject.grade
      });
      
      if (subject.teacher_name && updatedSubject.teacher_name === subject.teacher_name) {
        console.log('✅ SUCESSO: O professor foi mantido após a atualização do semestre!');
      } else {
        console.log('❌ PROBLEMA: O professor não foi mantido corretamente.');
      }
      
      if (updatedSubject.grade === '2º Ano') {
        console.log('✅ SUCESSO: O semestre foi atualizado corretamente!');
      } else {
        console.log('❌ PROBLEMA: O semestre não foi atualizado corretamente.');
      }
    } else {
      console.log('Nenhuma disciplina encontrada para testar');
    }
    
  } catch (error) {
    console.error('Erro no teste real:', error.response?.data || error.message);
  }
}

// Executar o teste
testRealScenario().catch(console.error);
