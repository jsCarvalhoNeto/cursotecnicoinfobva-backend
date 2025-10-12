import { validateTeacherSubjectAccess } from './baseController.js';

// Controller para recursos de disciplinas
export const resourceController = {
  // Buscar recursos de uma seção específica de uma disciplina
  getResourcesBySection: async (req, res) => {
    const { id, section } = req.params;
    const { user } = req;

    try {
      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Validar tipo de seção
      const validSections = ['content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources'];
      if (!validSections.includes(section)) {
        return res.status(400).json({ error: 'Seção inválida' });
      }

      const [rows] = await req.db.execute(
        'SELECT * FROM subject_resources WHERE subject_id = ? AND section_type = ? AND is_active = ? ORDER BY order_index ASC',
        [id, section, true]
      );

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar recursos:', error);
      res.status(500).json({ error: 'Erro ao buscar recursos da disciplina' });
    }
  },

  // Criar novo recurso
  createResource: async (req, res) => {
    const { id } = req.params;
    const { section_type, resource_type, title, file_path, file_url, description, order_index } = req.body;
    const { user } = req;

    try {
      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Validar campos obrigatórios
      if (!section_type || !resource_type || !title) {
        return res.status(400).json({ error: 'section_type, resource_type e title são obrigatórios' });
      }

      // Validar tipos
      const validSections = ['content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources'];
      const validResourceTypes = ['file', 'link', 'video', 'pdf', 'image', 'document'];
      
      if (!validSections.includes(section_type)) {
        return res.status(400).json({ error: 'section_type inválido' });
      }
      if (!validResourceTypes.includes(resource_type)) {
        return res.status(400).json({ error: 'resource_type inválido' });
      }

      const [result] = await req.db.execute(
        'INSERT INTO subject_resources (subject_id, section_type, resource_type, title, file_path, file_url, description, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, section_type, resource_type, title, file_path || null, file_url || null, description || null, order_index || 0]
      );

      res.status(201).json({ 
        success: true, 
        id: result.insertId,
        section_type,
        resource_type,
        title,
        file_path,
        file_url,
        description,
        order_index: order_index || 0
      });
    } catch (error) {
      console.error('Erro ao criar recurso:', error);
      res.status(500).json({ error: 'Erro ao criar recurso da disciplina' });
    }
  },

  // Atualizar recurso existente
 updateResource: async (req, res) => {
    const { id, resourceId } = req.params;
    const { title, file_path, file_url, description, order_index, is_active } = req.body;
    const { user } = req;

    try {
      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Verificar se o recurso pertence à disciplina
      const [existingResource] = await req.db.execute(
        'SELECT * FROM subject_resources WHERE id = ? AND subject_id = ?',
        [resourceId, id]
      );

      if (existingResource.length === 0) {
        return res.status(404).json({ error: 'Recurso não encontrado' });
      }

      // Construir query dinamicamente
      const updates = [];
      const params = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (file_path !== undefined) {
        updates.push('file_path = ?');
        params.push(file_path);
      }
      if (file_url !== undefined) {
        updates.push('file_url = ?');
        params.push(file_url);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (order_index !== undefined) {
        updates.push('order_index = ?');
        params.push(order_index);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
      }

      params.push(resourceId);

      const [result] = await req.db.execute(
        `UPDATE subject_resources SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.status(200).json({ success: true, message: 'Recurso atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar recurso:', error);
      res.status(500).json({ error: 'Erro ao atualizar recurso da disciplina' });
    }
  },

  // Deletar recurso
  deleteResource: async (req, res) => {
    const { id, resourceId } = req.params;
    const { user } = req;

    try {
      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Verificar se o recurso pertence à disciplina
      const [existingResource] = await req.db.execute(
        'SELECT * FROM subject_resources WHERE id = ? AND subject_id = ?',
        [resourceId, id]
      );

      if (existingResource.length === 0) {
        return res.status(404).json({ error: 'Recurso não encontrado' });
      }

      await req.db.execute(
        'DELETE FROM subject_resources WHERE id = ? AND subject_id = ?',
        [resourceId, id]
      );

      res.status(200).json({ success: true, message: 'Recurso deletado com sucesso!' });
    } catch (error) {
      console.error('Erro ao deletar recurso:', error);
      res.status(500).json({ error: 'Erro ao deletar recurso da disciplina' });
    }
  }
};
