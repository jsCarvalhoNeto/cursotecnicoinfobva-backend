import { validateTeacherSubjectAccess, validateStudentSubjectAccess } from './baseController.js';

// Controller para conteúdo de disciplinas
export const contentController = {
  // Buscar conteúdo de uma seção específica de uma disciplina
  getContentBySection: async (req, res) => {
    const { id, section } = req.params;
    const { user } = req;

    try {
      console.log('🔍 getContentBySection - req.user:', req.user);
      console.log('🔍 getContentBySection - req.userId:', req.userId);
      console.log('🔍 getContentBySection - Parâmetros recebidos:', { id, section, userId: req.userId });
      
      // Validar acesso à disciplina (permitir tanto professor quanto aluno matriculado)
      const mockUser = { id: req.user.id, db: req.db };
      console.log('🔍 getContentBySection - Validando acesso para user:', mockUser.id, 'na disciplina:', id);
      const isTeacher = await validateTeacherSubjectAccess(mockUser, id);
      const isStudent = await validateStudentSubjectAccess(mockUser, id);
      
      console.log('🔍 getContentBySection - Resultado validação acesso - Professor:', isTeacher, 'Aluno:', isStudent);
      if (!isTeacher && !isStudent) {
        console.log('❌ getContentBySection - Acesso negado à disciplina:', id);
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Validar tipo de seção
      const validSections = ['content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources'];
      console.log('🔍 getContentBySection - Validando seção:', section);
      if (!validSections.includes(section)) {
        console.log('❌ getContentBySection - Seção inválida:', section);
        return res.status(400).json({ error: 'Seção inválida' });
      }

      console.log('🔍 getContentBySection - Buscando conteúdo no banco de dados');
      const [rows] = await req.db.execute(
        'SELECT * FROM subject_content WHERE subject_id = ? AND section_type = ? AND is_active = ? ORDER BY order_index ASC',
        [id, section, true]
      );
      console.log('🔍 getContentBySection - Resultado consulta:', rows.length, 'registros encontrados');

      res.status(200).json(rows);
    } catch (error) {
      console.error('❌ Erro ao buscar conteúdo:', error);
      res.status(500).json({ error: 'Erro ao buscar conteúdo da disciplina' });
    }
  },

  // Buscar todo o conteúdo de uma disciplina
  getAllContent: async (req, res) => {
    const { id } = req.params;
    const { user } = req;

    try {
      // Validar acesso à disciplina (permitir tanto professor quanto aluno matriculado)
      const mockUser = { id: req.user.id, db: req.db };
      const isTeacher = await validateTeacherSubjectAccess(mockUser, id);
      const isStudent = await validateStudentSubjectAccess(mockUser, id);
      
      if (!isTeacher && !isStudent) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      const [rows] = await req.db.execute(
        'SELECT * FROM subject_content WHERE subject_id = ? AND is_active = ? ORDER BY section_type, order_index ASC',
        [id, true]
      );

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar todo o conteúdo:', error);
      res.status(500).json({ error: 'Erro ao buscar conteúdo da disciplina' });
    }
  },

  // Criar novo conteúdo
  createContent: async (req, res) => {
    console.log('🔍 createContent - Iniciando criação de conteúdo');
    const { id } = req.params;
    const { section_type, title, content, order_index } = req.body;
    const { user } = req;

    try {
      console.log('🔍 createContent - req.user:', req.user);
      console.log('🔍 createContent - req.userId:', req.userId);
      console.log('🔍 createContent - Parâmetros recebidos:', { id, section_type, title, content: content?.substring(0, 100) + '...', order_index, userId: req.userId });
      console.log('🔍 createContent - Banco de dados:', req.db ? 'disponível' : 'não disponível');
      console.log('🔍 createContent - Tipo de banco de dados:', req.dbType);
      console.log('🔍 createContent - Headers:', req.headers);

      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      console.log('🔍 createContent - Validando acesso para user:', mockUser.id, 'na disciplina:', id);
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      console.log('🔍 createContent - Resultado validação acesso:', hasAccess);
      if (!hasAccess) {
        console.log('❌ createContent - Acesso negado à disciplina:', id);
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Validar campos obrigatórios
      if (!section_type || !title) {
        console.log('❌ createContent - Campos obrigatórios faltando:', { section_type, title });
        return res.status(400).json({ error: 'section_type e title são obrigatórios' });
      }

      // Validar tipo de seção
      const validSections = ['content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources'];
      if (!validSections.includes(section_type)) {
        console.log('❌ createContent - Tipo de seção inválido:', section_type);
        return res.status(400).json({ error: 'section_type inválido' });
      }

      // Verificar se já existe conteúdo para esta seção
      console.log('🔍 createContent - Verificando se conteúdo já existe');
      const [existingContent] = await req.db.execute(
        'SELECT id FROM subject_content WHERE subject_id = ? AND section_type = ?',
        [id, section_type]
      );

      if (existingContent.length > 0) {
        // Atualizar conteúdo existente
        const contentId = existingContent[0].id;
        console.log('🔍 createContent - Conteúdo existente encontrado (ID:', contentId, '). Atualizando...');
        await req.db.execute(
          'UPDATE subject_content SET title = ?, content = ?, order_index = ? WHERE id = ?',
          [title, content || null, order_index || 0, contentId]
        );
        console.log('✅ createContent - Conteúdo atualizado com sucesso');

        res.status(200).json({ 
          success: true, 
          id: contentId,
          message: 'Conteúdo atualizado com sucesso!'
        });
      } else {
        // Criar novo conteúdo
        console.log('🔍 createContent - Nenhum conteúdo existente. Criando novo...');
        const [result] = await req.db.execute(
          'INSERT INTO subject_content (subject_id, section_type, title, content, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [id, section_type, title, content || null, order_index || 0, true]
        );
        console.log('✅ createContent - Conteúdo criado com sucesso, ID:', result.insertId);

        res.status(201).json({ 
          success: true, 
          id: result.insertId,
          section_type,
          title,
          content,
          order_index: order_index || 0
        });
      }
    } catch (error) {
      console.error('❌ Erro ao criar conteúdo:', error);
      console.error('❌ Stack do erro:', error.stack);
      res.status(500).json({ error: 'Erro ao criar conteúdo da disciplina', details: error.message });
    }
  },

  // Atualizar conteúdo existente
  updateContent: async (req, res) => {
    const { id, contentId } = req.params;
    const { title, content, order_index, is_active } = req.body;
    const { user } = req;

    try {
      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Verificar se o conteúdo pertence à disciplina
      const [existingContent] = await req.db.execute(
        'SELECT * FROM subject_content WHERE id = ? AND subject_id = ?',
        [contentId, id]
      );

      if (existingContent.length === 0) {
        return res.status(404).json({ error: 'Conteúdo não encontrado' });
      }

      // Construir query dinamicamente
      const updates = [];
      const params = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (content !== undefined) {
        updates.push('content = ?');
        params.push(content);
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

      params.push(contentId);

      const [result] = await req.db.execute(
        `UPDATE subject_content SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.status(200).json({ success: true, message: 'Conteúdo atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar conteúdo:', error);
      res.status(500).json({ error: 'Erro ao atualizar conteúdo da disciplina' });
    }
  },

  // Deletar conteúdo
  deleteContent: async (req, res) => {
    const { id, contentId } = req.params;
    const { user } = req;

    try {
      // Validar acesso à disciplina
      const mockUser = { id: req.user.id, db: req.db };
      const hasAccess = await validateTeacherSubjectAccess(mockUser, id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado à disciplina' });
      }

      // Verificar se o conteúdo pertence à disciplina
      const [existingContent] = await req.db.execute(
        'SELECT * FROM subject_content WHERE id = ? AND subject_id = ?',
        [contentId, id]
      );

      if (existingContent.length === 0) {
        return res.status(404).json({ error: 'Conteúdo não encontrado' });
      }

      await req.db.execute(
        'DELETE FROM subject_content WHERE id = ? AND subject_id = ?',
        [contentId, id]
      );

      res.status(200).json({ success: true, message: 'Conteúdo deletado com sucesso!' });
    } catch (error) {
      console.error('Erro ao deletar conteúdo:', error);
      res.status(500).json({ error: 'Erro ao deletar conteúdo da disciplina' });
    }
  }
};
