import { Student } from './studentService';

export interface StudentProfile {
  id: string;
  full_name?: string;
  email?: string;
 student_registration?: string;
  phone?: string;
  updated_at?: string;
}

export const updateStudentProfile = async (studentId: string, profileData: Partial<StudentProfile>): Promise<Student> => {
  try {
    const response = await fetch(`http://localhost:4002/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar perfil do aluno');
    }

    const updatedStudent = await response.json();
    return updatedStudent;
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
 }
};

export const changeStudentPassword = async (studentId: string, newPassword: string): Promise<void> => {
  try {
    const response = await fetch(`http://localhost:4002/api/students/${studentId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao alterar senha');
    }
  } catch (error) {
    console.error('Error changing student password:', error);
    throw error;
  }
};

export const getStudentProfile = async (studentId: string): Promise<Student> => {
  try {
    const response = await fetch(`http://localhost:4002/api/students/${studentId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar perfil do aluno');
    }

    const student = await response.json();
    return student;
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }
};
