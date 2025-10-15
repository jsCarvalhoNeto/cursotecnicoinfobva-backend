import { validateRole } from './baseController.js';

// Controller para usuários
export const userController = {
  // Rota para atualizar o papel de um usuário
 updateRole: async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Validar o papel
    if (!role || !validateRole(role)) {
      return res.status(400).json({ error: 'Papel inválido. Use: admin, student ou teacher.' });
    }

    try {
      // Verificar se o usuário existe
      const [userResult] = await req.db.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );
      if (userResult.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Remover papéis antigos do usuário
      await req.db.execute(
        'DELETE FROM user_roles WHERE user_id = ?',
        [id]
      );

      // Atribuir novo papel
      await req.db.execute(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [id, role]
      );

      res.status(200).json({ success: true, id, role });
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar papel do usuário no banco de dados.' });
    }
  },

 // Rota para buscar todos os usuários (com seus papéis)
 getAll: async (req, res) => {
    try {
      const [rows] = await req.db.execute(`
        SELECT u.id, u.email, u.created_at, p.full_name, p.student_registration
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        ORDER BY u.created_at DESC
      `);
      
      // Para cada usuário, buscar seus papéis
      const usersWithRoles = await Promise.all(rows.map(async (user) => {
        const [roles] = await req.db.execute(
          'SELECT role FROM user_roles WHERE user_id = ?',
          [user.id]
        );
        return {
          ...user,
          roles: roles.map(role => ({ role: role.role }))
        };
      }));
      
      res.status(200).json(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
    }
  }
};
