import dotenv from 'dotenv';
import { cacheService, createCacheKey } from '../services/cacheService.js';

dotenv.config();

// Middleware para verificar autenticação
export const requireAuth = async (req, res, next) => {
  console.log('🔍 requireAuth - Iniciando verificação de autenticação');
  console.log('🔍 requireAuth - Método:', req.method);
  console.log('🔍 requireAuth - URL:', req.url);
  console.log('🔍 requireAuth - Headers:', req.headers);
  console.log('🔍 requireAuth - Cookie sessionId:', req.cookies.sessionId);
  console.log('🔍 requireAuth - Banco de dados:', req.db ? 'disponível' : 'não disponível');
  console.log('🔍 requireAuth - Tipo de banco de dados:', req.dbType);
  
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    console.log('❌ requireAuth - Nenhum sessionId encontrado nos cookies');
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    if (req.dbType === 'mysql') {
      // Lógica para MySQL real - usar a conexão já estabelecida
      console.log('🔍 requireAuth - Usando banco de dados MySQL real');
      try {
        // Criar chave de cache para as informações do usuário
        const cacheKey = createCacheKey('user_auth', { sessionId });
        const cachedAuth = cacheService.get(cacheKey);
        
        if (cachedAuth) {
          console.log('🔍 requireAuth - Usando dados de autenticação do cache para:', sessionId);
          req.user = { id: sessionId, db: req.db };
          req.userId = sessionId;
          req.userRoles = cachedAuth.roles;
          req.userRole = cachedAuth.roles[0];
          console.log('✅ requireAuth - Autenticação bem-sucedida (cache) para usuário:', sessionId, 'Papéis:', req.userRoles);
          return next();
        }

        // Verificar se o usuário existe e tem papéis atribuídos (query otimizada)
        const [result] = await req.db.execute(`
          SELECT u.id, ur.role
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          WHERE u.id = ?
        `, [sessionId]);
        
        console.log('🔍 requireAuth - Resultado busca usuário e papéis:', result.length, 'registros encontrados');
        
        if (result.length === 0) {
          console.log('❌ requireAuth - Usuário não encontrado com ID:', sessionId);
          return res.status(401).json({ error: 'Sessão inválida' });
        }

        // Extrair papéis do resultado
        const roles = result.filter(row => row.role).map(row => row.role);
        console.log('🔍 requireAuth - Papéis encontrados:', roles);
        
        if (roles.length === 0) {
          console.log('❌ requireAuth - Usuário não tem papéis atribuídos:', sessionId);
          return res.status(403).json({ error: 'Usuário não tem permissão - nenhum papel atribuído' });
        }

        // Armazenar no cache (tempo menor para segurança)
        cacheService.set(cacheKey, { roles }, 5 * 60 * 1000); // 5 minutos

        req.user = { id: sessionId, db: req.db };
        req.userId = sessionId;
        req.userRoles = roles;
        req.userRole = roles[0];
        console.log('✅ requireAuth - Autenticação bem-sucedida para usuário:', sessionId, 'Papéis:', req.userRoles);
        next();
      } catch (error) {
        console.error('❌ Erro na verificação de autenticação com banco MySQL:', error);
        res.status(500).json({ error: 'Erro na verificação de autenticação.' });
      }
    } else {
      // Lógica para banco de dados mockado
      console.log('🔍 requireAuth - Usando banco de dados mockado');
      try {
        const user = req.db.getUserById(sessionId);
        console.log('🔍 requireAuth - Resultado busca usuário mockado:', user ? 'encontrado' : 'não encontrado');
        if (!user) {
          console.log('❌ requireAuth - Usuário não encontrado no banco mockado:', sessionId);
          return res.status(401).json({ error: 'Sessão inválida' });
        }
        
        const roles = req.db.getRolesByUserId(sessionId);
        console.log('🔍 requireAuth - Resultado busca papéis mockado:', roles.length, 'papéis encontrados');
        if (roles.length === 0) {
          console.log('❌ requireAuth - Usuário não tem papéis no banco mockado:', sessionId);
          return res.status(403).json({ error: 'Usuário não tem permissão - nenhum papel atribuído' });
        }
        
        req.user = { id: sessionId, db: req.db };
        req.userId = sessionId;
        req.userRoles = roles.map(role => role.role);
        req.userRole = roles[0].role;
        console.log('✅ requireAuth - Autenticação mockada bem-sucedida para usuário:', sessionId, 'Papéis:', req.userRoles);
        next();
      } catch (error) {
        console.error('❌ Erro na verificação de autenticação com banco mockado:', error);
        res.status(500).json({ error: 'Erro na verificação de autenticação.' });
      }
    }
  } catch (error) {
    console.error('❌ Erro geral na verificação de autenticação:', error);
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
        // Lógica para MySQL real - usar a conexão já estabelecida
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
            const [result] = await req.db.execute(ownerCheckQuery, queryParams);
            hasAccess = result.length > 0;
          }

          if (!hasAccess) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para acessar este recurso' });
          }

          next();
        } catch (error) {
          console.error('Erro na verificação de acesso ao recurso com banco MySQL:', error);
          res.status(500).json({ error: 'Erro na verificação de acesso ao recurso.' });
        }
      } else {
        // Para mock, vamos permitir acesso básico (você pode implementar lógica mais complexa se necessário)
        // Por enquanto, vamos assumir que o usuário tem permissão básica
        try {
          next();
        } catch (error) {
          console.error('Erro na verificação de acesso ao recurso com banco mockado:', error);
          res.status(500).json({ error: 'Erro na verificação de acesso ao recurso.' });
        }
      }
    } catch (error) {
      console.error('Erro na verificação de acesso ao recurso:', error);
      res.status(500).json({ error: 'Erro na verificação de acesso ao recurso.' });
    }
  };
};
