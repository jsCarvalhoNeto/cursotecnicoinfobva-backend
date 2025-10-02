import { Subject } from '@/types/subject';

const API_BASE_URL = 'http://localhost:4002/api';

export interface CreateSubjectData {
  name: string;
  description?: string;
  teacher_id?: string;
  schedule?: string;
  max_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
}

export interface UpdateSubjectData {
  name?: string;
  description?: string;
  teacher_id?: string;
  schedule?: string;
  max_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
}

export const subjectService = {
  // Criar nova disciplina
  create: async (subjectData: CreateSubjectData): Promise<Subject> => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subjectData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar disciplina');
    }

    return response.json();
  },

  // Buscar todas as disciplinas
 getAll: async (): Promise<Subject[]> => {
    const response = await fetch(`${API_BASE_URL}/subjects`);

    if (!response.ok) {
      throw new Error('Erro ao buscar disciplinas');
    }

    return response.json();
  },

  // Buscar disciplina por ID
  getById: async (id: string): Promise<Subject> => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar disciplina');
    }

    return response.json();
  },

  // Atualizar disciplina
  update: async (id: string, subjectData: UpdateSubjectData): Promise<Subject> => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subjectData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar disciplina');
    }

    return response.json();
  },

  // Deletar disciplina
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar disciplina');
    }
 },

  // Buscar disciplinas por professor
  getByTeacher: async (teacherId: string): Promise<Subject[]> => {
    const response = await fetch(`${API_BASE_URL}/subjects?teacher_id=${teacherId}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar disciplinas do professor');
    }

    return response.json();
  },

  // Buscar alunos por série
  getStudentsByGrade: async (grade: '1º Ano' | '2º Ano' | '3º Ano'): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/students/grade/${grade}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar alunos por série');
    }

    return response.json();
  }
};
