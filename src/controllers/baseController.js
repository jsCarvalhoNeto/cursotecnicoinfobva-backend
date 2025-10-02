import bcrypt from 'bcrypt';

// Função para gerar número de matrícula único
export const generateStudentRegistration = async (connection) => {
  try {
    // Obter o ano atual
    const currentYear = new Date().getFullYear();
    
    // Contar quantos estudantes já foram criados este ano
    const [result] = await connection.execute(`
      SELECT COUNT(*) as count FROM profiles p
      JOIN users u ON p.user_id = u.id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student' AND YEAR(p.created_at) = ?
    `, [currentYear]);
    
    const count = result[0].count || 0;
    const sequenceNumber = (count + 1).toString().padStart(4, '0'); // Padroniza com 4 dígitos
    return `EST${currentYear}${sequenceNumber}`;
  } catch (error) {
    console.error('Erro ao gerar matrícula:', error);
    // Fallback: gerar uma matrícula com timestamp
    return `EST${Date.now().toString().slice(-6)}`;
  }
};

// Função para hashear senha
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Função para comparar senha
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Função para validar série
export const validateGrade = (grade) => {
  const validGrades = ['1º Ano', '2º Ano', '3º Ano', '1 Ano', '2 Ano', '3 Ano'];
  if (!validGrades.includes(grade)) {
    return false;
  }
  return true;
};

// Função para normalizar série
export const normalizeGrade = (grade) => {
  if (grade === '1 Ano') return '1º Ano';
  if (grade === '2 Ano') return '2º Ano';
  if (grade === '3 Ano') return '3º Ano';
  return grade;
};

// Função para validar papel de usuário
export const validateRole = (role) => {
 const validRoles = ['admin', 'student', 'teacher'];
  return validRoles.includes(role);
};
