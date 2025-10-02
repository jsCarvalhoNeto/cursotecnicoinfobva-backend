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
  nextUserId: 4, // Próximo ID disponível após os usuários iniciais
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
};
