import dotenv from 'dotenv';

dotenv.config();

// Middleware para verificar autenticação
export const requireAuth = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    if (req.dbType === 'mysql') {
      // Lógica para MySQL real
      const db = await import('mysql2/promise');
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'informatica_wave'
      };
      
      const connection = await db.default.createConnection(dbConfig);
      try {
        // Verificar se o usuário existe e tem papéis atribuídos
        const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [sessionId]);
        
        if (users.length === 0) {
          return res.status(401).json({ error: 'Sessão inválida' });
        }
        
        // Verificar se o usuário tem pelo menos um papel atribuído
        const [roles] = await connection.execute('SELECT role FROM user_roles WHERE user_id = ?', [sessionId]);
        
        if (roles.length === 0) {
          return res.status(403).json({ error: 'Usuário não tem permissão - nenhum papel atribuído' });
        }
        
        req.userId = sessionId;
        req.userRoles = roles.map(role => role.role);
        req.userRole = roles[0].role;
        next();
      } finally {
        await connection.end();
      }
    } else {
      // Lógica para banco de dados mockado
      const user = req.db.getUserById(sessionId);
      if (!user) {
        return res.status(401).json({ error: 'Sessão inválida' });
      }
      
      const roles = req.db.getRolesByUserId(sessionId);
      if (roles.length === 0) {
        return res.status(403).json({ error: 'Usuário não tem permissão - nenhum papel atribuído' });
      }
      
      req.userId = sessionId;
      req.userRoles = roles.map(role => role.role);
      req.userRole = roles[0].role;
      next();
    }
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    res.status(500).json({ error: 'Erro na verificação de autenticação.' });
  }
};

// Middleware para verificar papel específico
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.userRoles) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const hasRole = req.userRoles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: `Acesso negado. Papel(s) necessário(s): ${allowedRoles.join(', ')}` });
    }

    next();
  };
};

// Middleware para verificar se o usuário é professor
export const requireTeacher = async (req, res, next) => {
  if (!req.userRoles) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (!req.userRoles.includes('teacher')) {
    return res.status(403).json({ error: 'Acesso negado. Requer papel de professor' });
  }

  next();
};

// Middleware para verificar se o usuário é aluno
export const requireStudent = async (req, res, next) => {
  if (!req.userRoles) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (!req.userRoles.includes('student')) {
    return res.status(403).json({ error: 'Acesso negado. Requer papel de aluno' });
  }

  next();
};

// Middleware para verificar se o usuário é administrador
export const requireAdmin = async (req, res, next) => {
  if (!req.userRoles) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (!req.userRoles.includes('admin')) {
    return res.status(403).json({ error: 'Acesso negado. Requer papel de administrador' });
  }

  next();
};

// Middleware para verificar permissões de acesso a recursos específicos
export const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    const userId = req.userId;
    const userRoles = req.userRoles;
    const resourceId = req.params.id || req.body.id;

    if (!userId || !userRoles) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
      if (req.dbType === 'mysql') {
        // Lógica para MySQL real
        const db = await import('mysql2/promise');
        const dbConfig = {
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'informatica_wave'
        };
        
        const connection = await db.default.createConnection(dbConfig);
        try {
          let hasAccess = false;
          let ownerCheckQuery = '';
          let queryParams = [];

          switch (resourceType) {
            case 'activity':
              // Verificar se a atividade pertence ao professor ou se o aluno está matriculado na disciplina
              if (userRoles.includes('teacher')) {
                ownerCheckQuery = 'SELECT id FROM activities WHERE id = ? AND teacher_id = ?';
                queryParams = [resourceId, userId];
              } else if (userRoles.includes('student')) {
                ownerCheckQuery = `
                  SELECT ag.id 
                  FROM activity_grades ag
                  JOIN enrollments e ON ag.enrollment_id = e.id
                  WHERE ag.activity_id = ? AND e.student_id = ?
                `;
                queryParams = [resourceId, userId];
              }
              break;
            case 'activity_grade':
              // Verificar se a nota está associada a uma atividade do professor ou a um aluno
              if (userRoles.includes('teacher')) {
                ownerCheckQuery = `
                  SELECT ag.id
                  FROM activity_grades ag
                  JOIN enrollments e ON ag.enrollment_id = e.id
                  JOIN activities a ON e.subject_id = a.subject_id
                  WHERE ag.id = ? AND a.teacher_id = ?
                `;
                queryParams = [resourceId, userId];
              } else if (userRoles.includes('student')) {
                ownerCheckQuery = `
                  SELECT ag.id
                  FROM activity_grades ag
                  JOIN enrollments e ON ag.enrollment_id = e.id
                  WHERE ag.id = ? AND e.student_id = ?
                `;
                queryParams = [resourceId, userId];
              }
              break;
            default:
              return res.status(400).json({ error: 'Tipo de recurso inválido' });
          }

          if (ownerCheckQuery) {
            const [result] = await connection.execute(ownerCheckQuery, queryParams);
            hasAccess = result.length > 0;
          }

          if (!hasAccess) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para acessar este recurso' });
          }

          next();
        } finally {
          await connection.end();
        }
      } else {
        // Para mock, vamos permitir acesso básico (você pode implementar lógica mais complexa se necessário)
        // Por enquanto, vamos assumir que o usuário tem permissão básica
        next();
      }
    } catch (error) {
      console.error('Erro na verificação de acesso ao recurso:', error);
      res.status(500).json({ error: 'Erro na verificação de acesso ao recurso.' });
    }
  };
};
