interface Subject {
  id: number;
  name: string;
}

interface Grade {
  id: number;
  studentName: string;
  value: number;
}

interface Absence {
  id: number;
  studentName: string;
  date: string;
  present: boolean;
}

export const getSubjectsByTeacher = async (teacherId: number): Promise<Subject[]> => {
  try {
    const API_URL = `http://localhost:4002/api/subjects?teacher_id=${teacherId}`;
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar disciplinas do professor');
    }
    const subjects = await response.json();
    return subjects.map((subject: { id: number; name: string }) => ({
      id: subject.id,
      name: subject.name
    }));
  } catch (error) {
    console.error('Erro ao buscar disciplinas por professor:', error);
    return [];
  }
};

export const getGradesBySubject = async (subjectId: number): Promise<Grade[]> => {
  // Implementação futura para buscar notas por matéria
  console.log(`Buscando notas para a matéria ID: ${subjectId}`);
 return [];
};

export const getAbsencesBySubject = async (subjectId: number): Promise<Absence[]> => {
  // Implementação futura para buscar faltas por matéria
  console.log(`Buscando faltas para a matéria ID: ${subjectId}`);
 return [];
};

export const getAllTeachers = async () => {
  const API_URL = 'http://localhost:4002/api/teachers';
  
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar professores da API');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    throw error;
  }
};
