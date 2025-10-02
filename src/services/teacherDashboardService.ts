/**
 * Serviços para o Painel do Professor
 * Integração com a API real
 */

export interface Subject {
  id: number;
  name: string;
  description?: string;
  teacher_id: number;
  schedule?: string;
  max_students: number;
  current_students?: number;
}

export interface Student {
  id: string;
  full_name: string;
  email: string;
  student_registration?: string;
  phone?: string;
  grade?: string;
  enrolled_subjects?: number;
}

export interface Activity {
  id: string;
  name: string;
  subject_id: number;
  subject_name: string;
  grade: string;
  type: 'individual' | 'team';
  teacher_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  deadline?: string;
  period?: string;
  evaluation_type?: string;
}

export interface ActivityGrade {
  id: number;
  activity_id: number;
  enrollment_id: number;
  grade: number;
  graded_at: string;
  graded_by: string;
  student_name: string;
  student_email: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'class' | 'exam' | 'deadline' | 'meeting';
  subject_id?: number;
  subject_name?: string;
  description?: string;
}

export interface UserProfile {
  full_name?: string;
  email: string;
  phone?: string;
  department?: string;
  hire_date?: string;
}

/**
 * Busca todas as disciplinas do professor
 */
export async function getTeacherSubjects(teacherId: string): Promise<Subject[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}/subjects`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar disciplinas do professor');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar disciplinas do professor:', error);
    throw error;
  }
}

/**
 * Busca atividades criadas pelo professor
 */
export async function getTeacherActivities(teacherId: string): Promise<Activity[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/activities/teacher/${teacherId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar atividades do professor');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar atividades do professor:', error);
    throw error;
  }
}

/**
 * Busca todas as notas de atividades de um professor
 */
export async function getTeacherActivityGrades(teacherId: string): Promise<ActivityGrade[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}/activity-grades`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar notas de atividades do professor');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar notas de atividades do professor:', error);
    throw error;
  }
}

/**
 * Busca alunos por disciplina para atribuição de notas
 */
export async function getStudentsBySubject(subjectId: number): Promise<any[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/subjects/${subjectId}/students`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar alunos por disciplina');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar alunos por disciplina:', error);
    throw error;
  }
}

/**
 * Busca todos os alunos de um professor (por disciplina)
 */
export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}/students`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar alunos do professor');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar alunos do professor:', error);
    throw error;
  }
}

/**
 * Busca alunos por série
 */
export async function getStudentsByGrade(grade: '1º Ano' | '2º Ano' | '3º Ano'): Promise<Student[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/students/grade/${grade}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar alunos por série');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar alunos por série:', error);
    throw error;
  }
}

/**
 * Busca atividades pendentes para correção
 */
export async function getPendingActivities(teacherId: string): Promise<Activity[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}/activities/pending`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar atividades pendentes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar atividades pendentes:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário do professor
 */
export async function getTeacherCalendarEvents(teacherId: string): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}/calendar`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar eventos do calendário');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    throw error;
  }
}

/**
 * Atualiza o perfil do professor
 */
export async function updateTeacherProfile(teacherId: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao atualizar perfil do professor:', error);
    throw error;
  }
}

/**
 * Altera a senha do professor
 */
export async function changeTeacherPassword(teacherId: string, newPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4002/api/teachers/${teacherId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ newPassword })
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao alterar senha do professor:', error);
    throw error;
  }
}

/**
 * Cria uma nova disciplina
 */
export async function createSubject(teacherId: string, data: Partial<Subject>): Promise<Subject> {
  try {
    const response = await fetch(`http://localhost:4002/api/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ ...data, teacher_id: teacherId })
    });

    if (!response.ok) {
      throw new Error('Erro ao criar disciplina');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    throw error;
  }
}

/**
 * Atualiza uma disciplina existente
 */
export async function updateSubject(teacherId: string, subjectId: number, data: Partial<Subject>): Promise<Subject> {
  try {
    const response = await fetch(`http://localhost:4002/api/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar disciplina');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    throw error;
  }
}

/**
 * Remove uma disciplina
 */
export async function deleteSubject(teacherId: string, subjectId: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4002/api/subjects/${subjectId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao remover disciplina:', error);
    throw error;
  }
}
