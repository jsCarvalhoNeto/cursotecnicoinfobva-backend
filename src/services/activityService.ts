export interface ActivityData {
  name: string;
  subject_id: number;
  grade?: string; // Opcional - o controller pega a série da disciplina
  type: 'individual' | 'team';
  description?: string;
  file_path?: string;
  file_name?: string;
  deadline?: string;
  period?: string;
  evaluation_type?: string;
}

export interface ActivityGradeData {
  activity_id: number;
  enrollment_id: number;
  grade: number;
  graded_by: string;
}

export interface ActivityGrade {
  grade_id?: number; // Adicionado para identificação única da nota
  id: number | null; // Pode ser nulo para alunos que ainda não submeteram
  activity_id: number | null; // Pode ser nulo para alunos que ainda não submeteram
  enrollment_id: number;
  student_id: number;
  grade: number | null;
  graded_at: string | null;
  graded_by: string | null;
  student_name: string | null; // Nome do aluno na submissão
  team_members: string | null;
  file_path: string | null;
  file_name: string | null;
  submitted_at: string | null; // Pode ser nulo para alunos que ainda não submeteram (usando graded_at como timestamp de submissão)
  status: 'graded' | 'submitted' | 'pending';
  student_name_display: string;
  student_email: string;
  subject_name: string;
  activity_name: string;
  teacher_name?: string; // Adicionado para mostrar o nome do professor
}

export interface StudentActivity {
  id: number;
  name: string;
  subject_name: string;
  teacher_name: string;
  type: 'individual' | 'team';
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  status: 'pending' | 'submitted' | 'completed';
}

export async function createActivity(activityData: ActivityData) {
  try {
    const response = await fetch('http://localhost:4002/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(activityData)
    });

    if (!response.ok) {
      throw new Error('Erro ao criar atividade');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error('Não foi possível criar a atividade.');
  }
}

export async function assignActivityGrade(gradeData: ActivityGradeData) {
  try {
    const response = await fetch('http://localhost:4002/api/activities/activity-grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(gradeData)
    });

    if (!response.ok) {
      throw new Error('Erro ao atribuir nota à atividade');
    }

    return await response.json();
  } catch (error) {
    console.error('Error assigning activity grade:', error);
    throw new Error('Não foi possível atribuir a nota à atividade.');
  }
}

export async function getActivityGrades(activityId: number): Promise<ActivityGrade[]> {
  try {
    const response = await fetch(`http://localhost:4002/api/activities/${activityId}/grades`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar notas da atividade');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching activity grades:', error);
    throw new Error('Não foi possível buscar as notas da atividade.');
  }
}

export async function updateActivity(activityId: number, activityData: ActivityData) {
  try {
    // Enviar como JSON normal - o upload de arquivos será tratado diretamente no modal
    // quando houver um novo arquivo para upload
    const response = await fetch(`http://localhost:4002/api/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(activityData)
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar atividade');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating activity:', error);
    throw new Error('Não foi possível atualizar a atividade.');
  }
}

export async function updateActivityGrade(gradeId: number, grade: number) {
  try {
    console.log('Tentando atualizar nota da atividade:', { gradeId, grade });
    const response = await fetch(`http://localhost:4002/api/activities/activity-grades/${gradeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ grade })
    });

    console.log('Resposta recebida:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      console.error('Status:', response.status);
      throw new Error(errorData.error || 'Erro ao atualizar nota da atividade');
    }

    const result = await response.json();
    console.log('Nota atualizada com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Error updating activity grade:', error);
    throw new Error('Não foi possível atualizar a nota da atividade.');
  }
}

export async function deleteActivityGrade(gradeId: number) {
  try {
    const response = await fetch(`http://localhost:4002/api/activities/activity-grades/${gradeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir nota da atividade');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting activity grade:', error);
    throw new Error('Não foi possível excluir a nota da atividade.');
  }
}

export async function deleteActivity(activityId: number) {
  try {
    const response = await fetch(`http://localhost:4002/api/activities/${activityId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir atividade');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Não foi possível excluir atividade.');
  }
}

export async function getStudentActivityGrades(): Promise<ActivityGrade[]> {
  try {
    const response = await fetch('http://localhost:4002/api/activities/student/grades', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar notas das atividades do aluno');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching student activity grades:', error);
    throw new Error('Não foi possível buscar as notas das atividades.');
  }
}
