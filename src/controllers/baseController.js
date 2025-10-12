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

// Função para validar acesso de professor à disciplina
export const validateTeacherSubjectAccess = async (user, subjectId) => {
  console.log('🔍 validateTeacherSubjectAccess - Iniciando validação de acesso');
  console.log('🔍 validateTeacherSubjectAccess - user:', user);
  console.log('🔍 validateTeacherSubjectAccess - subjectId:', subjectId);
  console.log('🔍 validateTeacherSubjectAccess - Parâmetros recebidos:', { user: !!user, subjectId, userId: user?.id });
  
  if (!user) {
    console.log('❌ validateTeacherSubjectAccess - Usuário não fornecido');
    return false;
  }

  if (!user.db) {
    console.log('❌ validateTeacherSubjectAccess - Banco de dados não disponível no objeto user');
    return false;
  }

  try {
    console.log('🔍 validateTeacherSubjectAccess - Validando acesso para user:', user.id, 'na disciplina:', subjectId);
    
    // Verificar se o usuário é admin (tem acesso a tudo)
    console.log('🔍 validateTeacherSubjectAccess - Verificando se usuário é admin');
    const [adminResult] = await user.db.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [user.id, 'admin']
    );
    console.log('🔍 validateTeacherSubjectAccess - Resultado admin:', adminResult);
    if (adminResult.length > 0) {
      console.log('✅ validateTeacherSubjectAccess - Usuário é admin, acesso concedido');
      return true;
    }

    // Verificar se o usuário é professor e está associado à disciplina
    console.log('🔍 validateTeacherSubjectAccess - Verificando associação professor-disciplina');
    const [teacherResult] = await user.db.execute(
      'SELECT ts.teacher_id FROM teacher_subjects ts WHERE ts.subject_id = ? AND ts.teacher_id = ?',
      [subjectId, user.id]
    );
    console.log('🔍 validateTeacherSubjectAccess - Resultado associação:', teacherResult);

    const hasAccess = teacherResult.length > 0;
    console.log('📊 validateTeacherSubjectAccess - Acesso concedido:', hasAccess);
    return hasAccess;
  } catch (error) {
    console.error('❌ Erro ao validar acesso de professor à disciplina:', error);
    console.error('❌ Stack do erro:', error.stack);
    return false;
  }
};

// Função para validar acesso de aluno à disciplina (leitura apenas)
export const validateStudentSubjectAccess = async (user, subjectId) => {
  console.log('🔍 validateStudentSubjectAccess - Iniciando validação de acesso de aluno');
  console.log('🔍 validateStudentSubjectAccess - user:', user);
  console.log('🔍 validateStudentSubjectAccess - subjectId:', subjectId);
  console.log('🔍 validateStudentSubjectAccess - Parâmetros recebidos:', { user: !!user, subjectId, userId: user?.id });
  
  if (!user) {
    console.log('❌ validateStudentSubjectAccess - Usuário não fornecido');
    return false;
  }

  if (!user.db) {
    console.log('❌ validateStudentSubjectAccess - Banco de dados não disponível no objeto user');
    return false;
  }

  try {
    console.log('🔍 validateStudentSubjectAccess - Validando acesso para aluno:', user.id, 'na disciplina:', subjectId);
    
    // Verificar se o usuário é admin (tem acesso a tudo)
    console.log('🔍 validateStudentSubjectAccess - Verificando se usuário é admin');
    const [adminResult] = await user.db.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [user.id, 'admin']
    );
    console.log('🔍 validateStudentSubjectAccess - Resultado admin:', adminResult);
    if (adminResult.length > 0) {
      console.log('✅ validateStudentSubjectAccess - Usuário é admin, acesso concedido');
      return true;
    }

    // Verificar se o usuário é aluno e está matriculado na disciplina
    console.log('🔍 validateStudentSubjectAccess - Verificando matrícula do aluno na disciplina');
    const [studentResult] = await user.db.execute(
      'SELECT e.id FROM enrollments e WHERE e.subject_id = ? AND e.student_id = ?',
      [subjectId, user.id]
    );
    console.log('🔍 validateStudentSubjectAccess - Resultado matrícula:', studentResult);

    const hasAccess = studentResult.length > 0;
    console.log('📊 validateStudentSubjectAccess - Acesso concedido:', hasAccess);
    return hasAccess;
  } catch (error) {
    console.error('❌ Erro ao validar acesso de aluno à disciplina:', error);
    console.error('❌ Stack do erro:', error.stack);
    return false;
  }
};
