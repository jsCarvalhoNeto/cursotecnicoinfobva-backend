/**
 * Serviço de validação para dados de estudantes (sem dependência de DB)
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface StudentFormData {
  fullName: string;
  email: string;
  studentRegistration?: string;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida formato da matrícula do estudante
 * Formato esperado: números e letras, 6-20 caracteres
 */
export function validateStudentRegistration(registration: string): boolean {
  const registrationRegex = /^[A-Za-z0-9]{6,20}$/;
  return registrationRegex.test(registration.trim());
}

/**
 * Valida nome completo
 */
export function validateFullName(name: string): boolean {
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100;
}

/**
 * Verifica se email já existe no sistema (Mocado)
 * Em um ambiente de desenvolvimento sem backend, sempre retorna false.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  console.log(`Verificando se o email existe (mocado): ${email}`);
  // Simula que o email nunca existe para permitir o fluxo de cadastro.
  await new Promise(resolve => setTimeout(resolve, 200));
  return false;
}

/**
 * Verifica se matrícula já existe no sistema (Mocado)
 * Em um ambiente de desenvolvimento sem backend, sempre retorna false.
 */
export async function checkRegistrationExists(registration: string): Promise<boolean> {
  console.log(`Verificando se a matrícula existe (mocado): ${registration}`);
  // Simula que a matrícula nunca existe para permitir o fluxo de cadastro.
  await new Promise(resolve => setTimeout(resolve, 200));
  return false;
}

/**
 * Valida todos os campos do formulário de estudante
 * A matrícula não é mais obrigatória pois será gerada automaticamente
 */
export async function validateStudentForm(data: StudentFormData): Promise<ValidationResult> {
  const errors: Record<string, string> = {};
  
  // Validação do nome
  if (!data.fullName.trim()) {
    errors.fullName = 'Nome completo é obrigatório';
  } else if (!validateFullName(data.fullName)) {
    errors.fullName = 'Nome deve ter entre 2 e 100 caracteres';
  }
  
  // Validação do email
  if (!data.email.trim()) {
    errors.email = 'Email é obrigatório';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Formato de email inválido';
  } else {
    // Verificar se email já existe
    const emailExists = await checkEmailExists(data.email);
    if (emailExists) {
      errors.email = 'Este email já está cadastrado no sistema';
    }
  }
  
  // Validação da matrícula (opcional agora, pois será gerada automaticamente)
  if (data.studentRegistration.trim() && !validateStudentRegistration(data.studentRegistration)) {
    errors.studentRegistration = 'Matrícula deve ter entre 6 e 20 caracteres (apenas letras e números)';
  } else if (data.studentRegistration.trim()) {
    // Verificar se matrícula já existe apenas se for fornecida
    const registrationExists = await checkRegistrationExists(data.studentRegistration);
    if (registrationExists) {
      errors.studentRegistration = 'Esta matrícula já está cadastrada no sistema';
    }
  }

  // Validação da série (obrigatória)
  if (!data.grade) {
    errors.grade = 'Série é obrigatória';
  }

  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida um campo específico do formulário
 */
export async function validateField(
  fieldName: keyof StudentFormData,
  value: string,
  allData?: Partial<StudentFormData>
): Promise<string | null> {
  switch (fieldName) {
    case 'fullName':
      if (!value.trim()) return 'Nome completo é obrigatório';
      if (!validateFullName(value)) return 'Nome deve ter entre 2 e 100 caracteres';
      return null;
      
    case 'email':
      if (!value.trim()) return 'Email é obrigatório';
      if (!validateEmail(value)) return 'Formato de email inválido';
      
      // Verificar duplicata apenas se o formato estiver correto
      const emailExists = await checkEmailExists(value);
      if (emailExists) return 'Este email já está cadastrado no sistema';
      return null;
      
    case 'studentRegistration':
      // Validação opcional - apenas se for fornecida
      if (value.trim() && !validateStudentRegistration(value)) {
        return 'Matrícula deve ter entre 6 e 20 caracteres (apenas letras e números)';
      }
      
      // Verificar duplicata apenas se for fornecida
      if (value.trim()) {
        const registrationExists = await checkRegistrationExists(value);
        if (registrationExists) return 'Esta matrícula já está cadastrada no sistema';
      }
      return null;
      
    default:
      return null;
  }
}

/**
 * Sanitiza dados do formulário
 * A matrícula será gerada automaticamente no servidor, então podemos remover do sanitizing
 */
export function sanitizeStudentData(data: StudentFormData): StudentFormData {
  return {
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    // A matrícula pode ser opcional, então tratamos isso
    studentRegistration: data.studentRegistration ? data.studentRegistration.trim().toUpperCase() : '',
    grade: data.grade,
  };
}
