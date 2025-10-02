/**
 * Serviço para gerenciamento de estudantes (usando API real)
 */

import { generateSecurePassword } from './passwordService';
import { sanitizeStudentData, type StudentFormData } from './validationService';

export interface CreateStudentResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    temporaryPassword: string;
  };
  error?: string;
}

export interface Student {
  id: string;
  email: string;
  full_name: string;
  student_registration: string;
  phone?: string;
  created_at: string;
}

/**
 * Cria um novo estudante no sistema (usando API real)
 */
export async function createStudent(data: StudentFormData): Promise<CreateStudentResponse> {
  console.log("Criando estudante com dados (API real):", data);
  
  try {
    const sanitizedData = sanitizeStudentData(data);
    const temporaryPassword = generateSecurePassword({ length: 12 });

    // Criar estudante via API (removendo studentRegistration do payload pois será gerado automaticamente)
    const { studentRegistration, ...studentDataWithoutRegistration } = sanitizedData;
    const response = await fetch('http://localhost:4002/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...studentDataWithoutRegistration,
        password: temporaryPassword,
        grade: sanitizedData.grade
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Erro ao criar estudante'
      };
    }

    const result = await response.json();
    
    console.log("Estudante criado com sucesso:", result);

    return {
      success: true,
      user: {
        id: result.id.toString(),
        email: sanitizedData.email,
        temporaryPassword,
      },
    };
  } catch (error) {
    console.error('Erro ao criar estudante (API real):', error);
    return {
      success: false,
      error: 'Erro de conexão com o servidor. Tente novamente.',
    };
  }
}

/**
 * Atualiza a senha de um estudante (usado para alteração após primeiro login)
 */
export async function updateStudentPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4002/api/students/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword })
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao atualizar senha do estudante:', error);
    return false;
  }
}

/**
 * Verifica se um estudante tem senha temporária (para forçar alteração no primeiro login)
 */
export async function hasTemporaryPassword(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4002/api/students/${userId}`);
    if (!response.ok) return false;
    
    const student = await response.json();
    // Senhas temporárias geradas têm 12 caracteres
    return student.password && student.password.length === 12;
  } catch (error) {
    console.error('Erro ao verificar senha temporária:', error);
    return false;
  }
}

/**
 * Busca informações de um estudante pelo ID (usando API real)
 */
export async function getStudentById(userId: string) {
  console.log(`Buscando estudante por ID (API real): ${userId}`);
  
  try {
    const response = await fetch(`http://localhost:4002/api/students/${userId}`);
    if (!response.ok) {
      throw new Error('Student not found');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estudante:', error);
    throw error;
  }
}

/**
 * Lista todos os estudantes do sistema (usando API real)
 */
export async function getAllStudents() {
  console.log("Buscando todos os estudantes (API real)...");
  
  try {
    const response = await fetch('http://localhost:4002/api/students');
    if (!response.ok) {
      throw new Error('Erro ao buscar estudantes');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estudantes:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário atual tem permissão para criar um novo estudante.
 */
export async function canCreateStudent(): Promise<boolean> {
  // Lógica de permissão real (pode ser implementada com base em tokens/autenticação)
  return true;
}
