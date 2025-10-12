/**
 * Banco de dados mockado centralizado para todo o sistema
 */

// Banco de dados mockado centralizado
export const mockDatabase = {
  users: [
    { id: '1', email: 'admin@portal.com', password: '$2b$10$wscu0DEMQP64/fwN3EoX2uKnUZI7EaVG0jex6SxneStAbdH8D7iS2', role: 'admin', fullName: 'Admin Geral', registration: null },
    { id: '2', email: 'teacher@portal.com', password: '$2b$10$wscu0DEMQP64/fwN3EoX2uKnUZI7EaVG0jex6SxneStAbdH8D7iS2', role: 'teacher', fullName: 'Prof. Carvalho', registration: null },
    { id: '3', email: 'student@portal.com', password: '$2b$10$wscu0DEMQP64/fwN3EoX2uKnUZI7EaVG0jex6SxneStAbdH8D7iS2', role: 'student', fullName: 'Alice Aluna', registration: '2024INFO001' },
  ],
  profiles: [
    {
      id: '1',
      user_id: '1',
      full_name: 'Admin Geral',
      email: 'admin@portal.com',
      student_registration: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: '2',
      full_name: 'Prof. Carvalho',
      email: 'teacher@portal.com',
      student_registration: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: '3',
      full_name: 'Alice Aluna',
      email: 'student@portal.com',
      student_registration: '2024INFO001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  roles: [
    { user_id: '1', role: 'admin' },
    { user_id: '2', role: 'teacher' },
    { user_id: '3', role: 'student' },
  ],
  subjects: [
    { id: '43', name: 'Matemática Básica', teacher_id: '2', description: 'Disciplina de matemática para o 1º ano' },
    { id: '44', name: 'Português Avançado', teacher_id: '2', description: 'Disciplina de português para o 2º ano' },
  ],
  teacher_subjects: [
    { id: '1', teacher_id: '2', subject_id: '43', assigned_at: new Date().toISOString() },
    { id: '2', teacher_id: '2', subject_id: '44', assigned_at: new Date().toISOString() },
  ],
  subject_content: [],
  nextUserId: 4, // Próximo ID disponível após os usuários iniciais
  nextId: 5, // Próximo ID disponível para outras tabelas
};

// Funções utilitárias para manipular o banco de dados
export const mockDbUtils = {
  /**
   * Adiciona um novo usuário ao banco de dados
   */
  addUser: (userData) => {
    const userId = mockDatabase.nextUserId.toString();
    const newUser = {
      ...userData,
      id: userId,
    };
    mockDatabase.users.push(newUser);
    mockDatabase.nextUserId++;
    return newUser;
  },

  /**
   * Adiciona um novo perfil ao banco de dados
   */
  addProfile: (profileData) => {
    const profileId = mockDatabase.nextUserId.toString(); // Usar o mesmo contador para consistência
    const newProfile = {
      ...profileData,
      id: profileId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDatabase.profiles.push(newProfile);
    return newProfile;
  },

  /**
   * Adiciona uma nova role ao banco de dados
   */
  addRole: (roleData) => {
    mockDatabase.roles.push(roleData);
    return roleData;
  },

  /**
   * Busca um usuário por email
   */
  getUserByEmail: (email) => {
    return mockDatabase.users.find(user => user.email === email);
  },

  /**
   * Busca um usuário por ID
   */
  getUserById: (id) => {
    return mockDatabase.users.find(user => user.id === id);
  },

  /**
   * Busca um perfil por ID de usuário
   */
  getProfileByUserId: (userId) => {
    return mockDatabase.profiles.find(profile => profile.user_id === userId);
  },

  /**
   * Busca todas as roles de um usuário
   */
  getRolesByUserId: (userId) => {
    return mockDatabase.roles.filter(role => role.user_id === userId);
  },

  /**
   * Atualiza a senha de um usuário
   */
  updateUserPassword: (userId, newPassword) => {
    const userIndex = mockDatabase.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      mockDatabase.users[userIndex].password = newPassword;
      return true;
    }
    return false;
  },

  /**
   * Remove um usuário e seus dados relacionados
   */
  removeUser: (userId) => {
    const userIndex = mockDatabase.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      mockDatabase.users.splice(userIndex, 1);
      mockDatabase.profiles = mockDatabase.profiles.filter(profile => profile.user_id !== userId);
      mockDatabase.roles = mockDatabase.roles.filter(role => role.user_id !== userId);
      return true;
    }
    return false;
  },

  /**
   * Atualiza um perfil existente
   */
  updateProfile: (userId, profileData) => {
    const profileIndex = mockDatabase.profiles.findIndex(profile => profile.user_id === userId);
    if (profileIndex !== -1) {
      mockDatabase.profiles[profileIndex] = {
        ...mockDatabase.profiles[profileIndex],
        ...profileData,
        updated_at: new Date().toISOString(),
      };
      return true;
    }
    return false;
  },

  /**
   * Busca todos os estudantes
   */
  getAllStudents: () => {
    return mockDatabase.profiles
      .map(profile => ({
        ...profile,
        roles: mockDatabase.roles.filter(role => role.user_id === profile.user_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Executa uma query simulada no banco de dados mockado
   */
  execute: async (query, params = []) => {
    console.log('🔍 mockDbUtils.execute - Query recebida:', query);
    console.log('🔍 mockDbUtils.execute - Parâmetros:', params);
    
    try {
      // Simular delay para representar tempo de banco de dados
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verificar se é uma query de busca de papéis de usuário
      if (query.includes('user_roles WHERE user_id = ? AND role = ?')) {
        const [userId, role] = params;
        const result = mockDatabase.roles.filter(r => r.user_id === userId && r.role === role);
        console.log('🔍 mockDbUtils.execute - Resultado user_roles admin:', result);
        return [result, null];
      }

      // Verificar se é uma query de busca de papéis de usuário (geral)
      if (query.includes('user_roles WHERE user_id = ?')) {
        const [userId] = params;
        const result = mockDatabase.roles.filter(r => r.user_id === userId);
        console.log('🔍 mockDbUtils.execute - Resultado user_roles geral:', result);
        return [result, null];
      }

      // Verificar se é uma query de busca de associação professor-disciplina
      if (query.includes('teacher_subjects ts WHERE ts.subject_id = ? AND ts.teacher_id = ?')) {
        const [subjectId, teacherId] = params;
        const result = mockDatabase.teacher_subjects.filter(ts => ts.subject_id === subjectId && ts.teacher_id === teacherId);
        console.log('🔍 mockDbUtils.execute - Resultado teacher_subjects:', result);
        return [result, null];
      }

      // Verificar se é uma query de busca de conteúdo de disciplina
      if (query.includes('subject_content WHERE subject_id = ? AND section_type = ?')) {
        const [subjectId, section] = params;
        const result = mockDatabase.subject_content.filter(sc => sc.subject_id === subjectId && sc.section_type === section && sc.is_active === true);
        console.log('🔍 mockDbUtils.execute - Resultado subject_content por seção:', result);
        return [result, null];
      }

      // Verificar se é uma query de busca de todo o conteúdo de uma disciplina
      if (query.includes('subject_content WHERE subject_id = ? AND is_active = ?')) {
        const [subjectId, isActive] = params;
        const result = mockDatabase.subject_content.filter(sc => sc.subject_id === subjectId && sc.is_active === isActive);
        console.log('🔍 mockDbUtils.execute - Resultado subject_content geral:', result);
        return [result, null];
      }

      // Verificar se é uma query de inserção de conteúdo
      if (query.includes('INSERT INTO subject_content')) {
        console.log('🔍 mockDbUtils.execute - Processando INSERT com query:', query);
        console.log('🔍 mockDbUtils.execute - Parâmetros recebidos:', params);
        const [subject_id, section_type, title, content, order_index, is_active] = params;
        const newContent = {
          id: mockDatabase.nextId.toString(),
          subject_id,
          section_type,
          title,
          content: content || null,
          order_index: order_index || 0,
          is_active: is_active !== undefined ? is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockDatabase.subject_content.push(newContent);
        mockDatabase.nextId++;
        console.log('🔍 mockDbUtils.execute - Conteúdo criado:', newContent);
        return [{ insertId: newContent.id }, null];
      }

      // Verificar se é uma query de busca de conteúdo existente para atualização
      if (query.includes('SELECT * FROM subject_content WHERE id = ? AND subject_id = ?')) {
        const [contentId, subjectId] = params;
        const result = mockDatabase.subject_content.filter(sc => sc.id === contentId && sc.subject_id === subjectId);
        console.log('🔍 mockDbUtils.execute - Resultado subject_content existente:', result);
        return [result, null];
      }

      // Verificar se é uma query de atualização de conteúdo
      if (query.includes('UPDATE subject_content SET')) {
        const contentId = params[params.length - 1]; // O último parâmetro é o ID
        const contentIndex = mockDatabase.subject_content.findIndex(sc => sc.id === contentId);
        if (contentIndex !== -1) {
          // Atualizar os campos conforme os parâmetros
          let paramIndex = 0;
          if (query.includes('title = ?')) {
            mockDatabase.subject_content[contentIndex].title = params[paramIndex];
            paramIndex++;
          }
          if (query.includes('content = ?')) {
            mockDatabase.subject_content[contentIndex].content = params[paramIndex];
            paramIndex++;
          }
          if (query.includes('order_index = ?')) {
            mockDatabase.subject_content[contentIndex].order_index = params[paramIndex];
            paramIndex++;
          }
          if (query.includes('is_active = ?')) {
            mockDatabase.subject_content[contentIndex].is_active = params[paramIndex];
          }
          mockDatabase.subject_content[contentIndex].updated_at = new Date().toISOString();
          console.log('🔍 mockDbUtils.execute - Conteúdo atualizado:', mockDatabase.subject_content[contentIndex]);
          return [{ affectedRows: 1 }, null];
        }
        return [{ affectedRows: 0 }, null];
      }

      // Verificar se é uma query de exclusão de conteúdo
      if (query.includes('DELETE FROM subject_content WHERE id = ? AND subject_id = ?')) {
        const [contentId, subjectId] = params;
        const initialLength = mockDatabase.subject_content.length;
        mockDatabase.subject_content = mockDatabase.subject_content.filter(sc => !(sc.id === contentId && sc.subject_id === subjectId));
        const deletedCount = initialLength - mockDatabase.subject_content.length;
        console.log('🔍 mockDbUtils.execute - Conteúdo deletado:', { contentId, subjectId, deletedCount });
        return [{ affectedRows: deletedCount }, null];
      }

      // Caso padrão - retornar array vazio
      console.log('🔍 mockDbUtils.execute - Query não mapeada, retornando array vazio');
      return [[], null];
    } catch (error) {
      console.error('❌ mockDbUtils.execute - Erro ao executar query:', error);
      throw error;
    }
  },

  /**
   * Inicia uma transação (simulado)
   */
  beginTransaction: async () => {
    console.log('🔍 mockDbUtils.beginTransaction - Iniciando transação mockada');
    // No mock, não precisamos realmente iniciar uma transação
    return;
  },

  /**
   * Faz commit da transação (simulado)
   */
  commit: async () => {
    console.log('🔍 mockDbUtils.commit - Fazendo commit mockado');
    // No mock, não precisamos realmente fazer commit
    return;
  },

  /**
   * Faz rollback da transação (simulado)
   */
  rollback: async () => {
    console.log('🔍 mockDbUtils.rollback - Fazendo rollback mockado');
    // No mock, não precisamos realmente fazer rollback
    return;
  },

  /**
   * Fecha a conexão (simulado)
   */
  end: async () => {
    console.log('🔍 mockDbUtils.end - Fechando conexão mockada');
    // No mock, não precisamos realmente fechar conexão
    return;
  },

  /**
   * Busca uma disciplina por ID
   */
  getSubjectById: (subjectId) => {
    return mockDatabase.subjects.find(subject => subject.id === subjectId);
  },

  /**
   * Busca todas as disciplinas
   */
  getAllSubjects: () => {
    return mockDatabase.subjects;
  },

  /**
   * Busca disciplinas de um professor
   */
  getSubjectsByTeacherId: (teacherId) => {
    return mockDatabase.subjects.filter(subject => subject.teacher_id === teacherId);
  },

  /**
   * Busca conteúdo de uma disciplina por tipo de seção
   */
  getContentBySubjectAndSection: (subjectId, sectionType) => {
    return mockDatabase.subject_content.filter(sc => sc.subject_id === subjectId && sc.section_type === sectionType && sc.is_active === true);
  },

  /**
   * Busca todo o conteúdo de uma disciplina
   */
  getAllContentBySubject: (subjectId) => {
    return mockDatabase.subject_content.filter(sc => sc.subject_id === subjectId && sc.is_active === true);
  },

  /**
   * Busca associação professor-disciplina
   */
  getTeacherSubjectAssociation: (teacherId, subjectId) => {
    return mockDatabase.teacher_subjects.find(ts => ts.teacher_id === teacherId && ts.subject_id === subjectId);
  },

  /**
   * Busca todas as associações de um professor
   */
  getTeacherSubjectAssociations: (teacherId) => {
    return mockDatabase.teacher_subjects.filter(ts => ts.teacher_id === teacherId);
  },

  /**
   * Busca todas as associações de uma disciplina
   */
  getSubjectTeacherAssociations: (subjectId) => {
    return mockDatabase.teacher_subjects.filter(ts => ts.subject_id === subjectId);
  }
};
