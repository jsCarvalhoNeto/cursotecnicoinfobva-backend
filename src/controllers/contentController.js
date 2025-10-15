import { subjectController } from './subjectController.js';

// Controller para conteúdo/material das disciplinas
export const contentController = {
  // Rota para buscar todo o conteúdo de uma disciplina
  getAllBySubject: async (req, res) => {
    const { id } = req.params; // subjectId

    try {
      // Verificar se a disciplina existe
      const [subjectResult] = await req.db.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [id]
      );
      if (subjectResult.length === 0) {
        return res.status(404).json({ error: 'Disciplina não encontrada.' });
      }

      // Buscar todo o conteúdo da disciplina
      const [rows] = await req.db.execute(`
        SELECT *
        FROM subject_content
        WHERE subject_id = ? AND is_active = TRUE
        ORDER BY section_type, order_index
      `, [id]);

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar conteúdo da disciplina:', error);
      res.status(500).json({ error: 'Erro ao buscar conteúdo da disciplina.' });
    }
  },

  // Rota para buscar conteúdo de uma disciplina por tipo de seção
  getBySubjectAndSection: async (req, res) => {
    const { id, section } = req.params; // subjectId e sectionType

    try {
      // Verificar se a disciplina existe
      const [subjectResult] = await req.db.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [id]
      );
      if (subjectResult.length === 0) {
        return res.status(404).json({ error: 'Disciplina não encontrada.' });
      }

      // Buscar conteúdo da disciplina por tipo de seção
      const [rows] = await req.db.execute(`
        SELECT *
        FROM subject_content
        WHERE subject_id = ? AND section_type = ? AND is_active = TRUE
        ORDER BY order_index
      `, [id, section]);

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar conteúdo da disciplina por seção:', error);
      res.status(500).json({ error: 'Erro ao buscar conteúdo da disciplina por seção.' });
    }
  },

  // Rota para buscar recursos de uma disciplina
  getResourcesBySubject: async (req, res) => {
    const { id } = req.params; // subjectId

    try {
      // Verificar se a disciplina existe
      const [subjectResult] = await req.db.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [id]
      );
      if (subjectResult.length === 0) {
        return res.status(404).json({ error: 'Disciplina não encontrada.' });
      }

      // Buscar recursos da disciplina
      const [rows] = await req.db.execute(`
        SELECT *
        FROM subject_resources
        WHERE subject_id = ? AND is_active = TRUE
        ORDER BY section_type, order_index
      `, [id]);

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar recursos da disciplina:', error);
      res.status(500).json({ error: 'Erro ao buscar recursos da disciplina.' });
    }
  },

  // Rota para buscar recursos de uma disciplina por tipo de seção
  getResourcesBySubjectAndSection: async (req, res) => {
    const { id, section } = req.params; // subjectId e sectionType

    try {
      // Verificar se a disciplina existe
      const [subjectResult] = await req.db.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [id]
      );
      if (subjectResult.length === 0) {
        return res.status(404).json({ error: 'Disciplina não encontrada.' });
      }

      // Buscar recursos da disciplina por tipo de seção
      const [rows] = await req.db.execute(`
        SELECT *
        FROM subject_resources
        WHERE subject_id = ? AND section_type = ? AND is_active = TRUE
        ORDER BY order_index
      `, [id, section]);

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar recursos da disciplina por seção:', error);
      res.status(500).json({ error: 'Erro ao buscar recursos da disciplina por seção.' });
    }
  },

  // Rota para criar/editar conteúdo de uma disciplina
  createOrUpdateContent: async (req, res) => {
    const { id } = req.params; // subjectId
    const { section_type, title, content, order_index = 0 } = req.body;

    try {
      // Verificar se a disciplina existe
      const [subjectResult] = await req.db.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [id]
      );
      if (subjectResult.length === 0) {
        return res.status(404).json({ error: 'Disciplina não encontrada.' });
      }

      // Verificar se já existe conteúdo com o mesmo tipo e título para esta disciplina
      const [existingContent] = await req.db.execute(`
        SELECT id FROM subject_content 
        WHERE subject_id = ? AND section_type = ? AND title = ?
      `, [id, section_type, title]);

      if (existingContent.length > 0) {
        // Atualizar conteúdo existente
        await req.db.execute(`
          UPDATE subject_content 
          SET content = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
          WHERE subject_id = ? AND section_type = ? AND title = ?
        `, [content, order_index, id, section_type, title]);

        res.status(200).json({ message: 'Conteúdo atualizado com sucesso.' });
      } else {
        // Criar novo conteúdo
        await req.db.execute(`
          INSERT INTO subject_content (subject_id, section_type, title, content, order_index)
          VALUES (?, ?, ?, ?, ?)
        `, [id, section_type, title, content, order_index]);

        res.status(201).json({ message: 'Conteúdo criado com sucesso.' });
      }
    } catch (error) {
      console.error('Erro ao criar ou atualizar conteúdo:', error);
      res.status(500).json({ error: 'Erro ao criar ou atualizar conteúdo.' });
    }
  },

  // Rota para deletar conteúdo de uma disciplina
  deleteContent: async (req, res) => {
    const { id, contentId } = req.params; // subjectId e contentId

    try {
      // Verificar se o conteúdo existe e pertence à disciplina
      const [contentResult] = await req.db.execute(`
        SELECT id FROM subject_content 
        WHERE id = ? AND subject_id = ?
      `, [contentId, id]);

      if (contentResult.length === 0) {
        return res.status(404).json({ error: 'Conteúdo não encontrado.' });
      }

      await req.db.execute('DELETE FROM subject_content WHERE id = ?', [contentId]);

      res.status(200).json({ message: 'Conteúdo deletado com sucesso.' });
    } catch (error) {
      console.error('Erro ao deletar conteúdo:', error);
      res.status(50).json({ error: 'Erro ao deletar conteúdo.' });
    }
  }
};
