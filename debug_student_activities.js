import fetch from 'node-fetch';

async function debugStudentActivities() {
  try {
    console.log('=== Testando API de atividades do aluno ===');
    
    // Testar rota de atividades do aluno
    const activitiesResponse = await fetch('http://localhost:4002/api/activities/student', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('Status atividades:', activitiesResponse.status);
    
    if (activitiesResponse.ok) {
      const activitiesData = await activitiesResponse.json();
      console.log('Atividades recebidas:', activitiesData.length);
      console.log('Primeiras 2 atividades:', activitiesData.slice(0, 2));
    } else {
      const error = await activitiesResponse.json();
      console.log('Erro atividades:', error);
    }

    console.log('\n=== Testando API de notas de atividades do aluno ===');
    
    // Testar rota de notas de atividades do aluno
    const gradesResponse = await fetch('http://localhost:4002/api/activities/student/grades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('Status notas:', gradesResponse.status);
    
    if (gradesResponse.ok) {
      const gradesData = await gradesResponse.json();
      console.log('Notas recebidas:', gradesData.length);
      console.log('Primeiras 2 notas:', gradesData.slice(0, 2));
    } else {
      const error = await gradesResponse.json();
      console.log('Erro notas:', error);
    }

  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

debugStudentActivities();
