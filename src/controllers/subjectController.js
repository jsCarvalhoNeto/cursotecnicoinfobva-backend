import { normalizeGrade, validateGrade } from './baseController.js';

// Controller para disciplinas
export const subjectController = {
  // Rota para criar uma nova disciplina
 create: async (req, res) => {
    const { name, description, schedule, max_students, teacher_id, grade } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome da disciplina é obrigatório.' });
    }

    try {
      // Verificar se o professor existe
      if (teacher_id) {
        const [teacherResult] = await req.db.execute(
          'SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = ? AND ur.role = ?',
          [teacher_id, 'teacher']
        );
        if (teacherResult.length === 0) {
          return res.status(400).json({ error: 'Professor não encontrado ou não é um professor válido.' });
        }
      }

      // Verificar se a série é válida (aceitando variações) e normalizar
      let normalizedGrade = grade;
      if (grade) {
        if (!validateGrade(grade)) {
          return res.status(400).json({ error: 'Série inválida. Use: 1º Ano, 2º Ano ou 3º Ano.' });
        }
        // Normalizar para o formato com º
        normalizedGrade = normalizeGrade(grade);
      }

      // Inserir a disciplina
      const [result] = await req.db.execute(
        'INSERT INTO subjects (name, description, schedule, max_students, teacher_id, grade) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description || null, schedule || null, max_students || 50, teacher_id || null, normalizedGrade || null]
      );

      // Se um professor foi especificado, criar associação na tabela teacher_subjects
      if (teacher_id) {
        await req.db.execute(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
          [teacher_id, result.insertId]
        );
      }

      // Se a série foi especificada, matricular automaticamente todos os alunos dessa série
      if (normalizedGrade) {
        // Buscar todos os alunos matriculados na série especificada
        const [studentsInGrade] = await req.db.execute(
          'SELECT u.id FROM users u JOIN profiles p ON u.id = p.user_id WHERE p.grade = ?',
          [normalizedGrade]
        );

        if (studentsInGrade.length > 0) {
          // Matricular todos os alunos da série na nova disciplina
          for (const student of studentsInGrade) {
            await req.db.execute(
              'INSERT INTO enrollments (student_id, subject_id, enrollment_date) VALUES (?, ?, NOW())',
              [student.id, result.insertId]
            );
          }
          console.log(`Matriculados ${studentsInGrade.length} alunos da série ${normalizedGrade} na disciplina ${result.insertId}`);
        }
      }

      res.status(201).json({ success: true, id: result.insertId, ...req.body });
    } catch (error) {
      console.error('Erro ao inserir disciplina:', error);
      res.status(500).json({ error: 'Erro ao conectar ou inserir no banco de dados.' });
    }
  },

  // Rota para buscar todas as disciplinas
 getAll: async (req, res) => {
    try {
      let query = `
        SELECT s.*, p.full_name as teacher_name
        FROM subjects s
        LEFT JOIN profiles p ON s.teacher_id = p.user_id
      `;
      
      const params = [];
      if (req.query.teacher_id) {
        query += ' WHERE s.teacher_id = ?';
        params.push(req.query.teacher_id);
      }
      
      query += ' ORDER BY s.created_at DESC';
      
      const [rows] = await req.db.execute(query, params);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
    }
 },

  // Rota para deletar uma disciplina
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      await req.db.execute('DELETE FROM subjects WHERE id = ?', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar disciplina:', error);
      res.status(500).json({ error: 'Erro ao deletar disciplina do banco de dados.' });
    }
 },

  // Rota para atualizar uma disciplina
  update: async (req, res) => {
    const { id } = req.params;
    const { name, description, schedule, max_students, teacher_id, grade } = req.body;

    try {
      // Verificar se a disciplina existe
      const [subjectResult] = await req.db.execute(
        'SELECT * FROM subjects WHERE id = ?',
        [id]
      );
      if (subjectResult.length === 0) {
        return res.status(404).json({ error: 'Disciplina não encontrada.' });
      }

      const existingSubject = subjectResult[0];

      // Verificar se o professor existe (se for fornecido)
      if (teacher_id) {
        const [teacherResult] = await req.db.execute(
          'SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = ? AND ur.role = ?',
          [teacher_id, 'teacher']
        );
        if (teacherResult.length === 0) {
          return res.status(400).json({ error: 'Professor não encontrado ou não é um professor válido.' });
        }
      }

      // Verificar se a série é válida (aceitando variações) e normalizar
      let normalizedGrade = grade;
      if (grade) {
        if (!validateGrade(grade)) {
          return res.status(400).json({ error: 'Série inválida. Use: 1º Ano, 2º Ano ou 3º Ano.' });
        }
        // Normalizar para o formato com º
        normalizedGrade = normalizeGrade(grade);
      }

      // Construir a query dinamicamente com base nos campos fornecidos
      const updates = [];
      const params = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (schedule !== undefined) {
        updates.push('schedule = ?');
        params.push(schedule);
      }
      if (max_students !== undefined) {
        updates.push('max_students = ?');
        params.push(max_students);
      }
      if (teacher_id !== undefined) {
        updates.push('teacher_id = ?');
        params.push(teacher_id);
      }
      if (grade !== undefined) {
        updates.push('grade = ?');
        params.push(normalizedGrade);
      }

      // Se não houver campos para atualizar, retornar erro
      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
      }

      // Adicionar o ID ao final dos parâmetros
      params.push(id);

      // Atualizar a disciplina
      const [result] = await req.db.execute(
        `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Atualizar associação na tabela teacher_subjects apenas se teacher_id foi fornecido
      if (teacher_id !== undefined) {
        if (teacher_id) {
          await req.db.execute(
            'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
            [teacher_id, id]
          );
        } else {
          // Se teacher_id for null/undefined (e foi explicitamente enviado), remover associação existente
          await req.db.execute(
            'DELETE FROM teacher_subjects WHERE subject_id = ?',
            [id]
          );
        }
      }

      res.status(200).json({ success: true, message: 'Disciplina atualizada com sucesso!', id });
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      res.status(500).json({ error: 'Erro ao atualizar disciplina no banco de dados.' });
    }
  },

  // Rota para associar disciplinas a um professor (muitos-para-muitos)
  assignToTeacher: async (req, res) => {
    const { teacherId } = req.params;
    const { subjectIds } = req.body; // Array de IDs de disciplinas

    if (!subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({ error: 'subjectIds deve ser um array de IDs de disciplinas.' });
    }

    try {
      // Verificar se o professor existe
      const [teacherResult] = await req.db.execute(
        'SELECT id FROM users WHERE id = ? AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?)',
        [teacherId, teacherId, 'teacher']
      );
      if (teacherResult.length === 0) {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      // Associar cada disciplina ao professor
      for (const subjectId of subjectIds) {
        // Verificar se a disciplina existe
        const [subjectResult] = await req.db.execute(
          'SELECT id FROM subjects WHERE id = ?',
          [subjectId]
        );
        if (subjectResult.length > 0) {
          // Inserir ou atualizar associação (ON DUPLICATE KEY UPDATE)
          await req.db.execute(`
            INSERT INTO teacher_subjects (teacher_id, subject_id) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
          `, [teacherId, subjectId]);
        }
      }

      res.status(200).json({ 
        success: true, 
        message: `${subjectIds.length} disciplinas associadas ao professor.`,
        teacherId,
        subjectIds
      });
    } catch (error) {
      console.error('Erro ao associar disciplinas ao professor:', error);
      res.status(500).json({ error: 'Erro ao associar disciplinas ao professor.' });
    }
  },

  // Rota para remover associação de disciplina com professor
  removeFromTeacher: async (req, res) => {
    const { teacherId, subjectId } = req.params;

    try {
      // Remover a associação da tabela teacher_subjects
      const [result] = await req.db.execute(
        'DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?',
        [teacherId, subjectId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Associação não encontrada.' });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Disciplina removida do professor.',
        teacherId,
        subjectId
      });
    } catch (error) {
      console.error('Erro ao remover associação de disciplina com professor:', error);
      res.status(500).json({ error: 'Erro ao remover associação de disciplina com professor.' });
    }
 },

  // Rota para atualizar todas as disciplinas de um professor (substituir completamente)
  updateTeacherSubjects: async (req, res) => {
    const { teacherId } = req.params;
    const { subjectIds } = req.body; // Array de IDs de disciplinas

    if (!subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({ error: 'subjectIds deve ser um array de IDs de disciplinas.' });
    }

    try {
      // Verificar se o professor existe
      const [teacherResult] = await req.db.execute(
        'SELECT id FROM users WHERE id = ? AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?)',
        [teacherId, teacherId, 'teacher']
      );
      if (teacherResult.length === 0) {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      // Remover todas as associações atuais
      await req.db.execute(
        'DELETE FROM teacher_subjects WHERE teacher_id = ?',
        [teacherId]
      );

      // Associar as novas disciplinas
      for (const subjectId of subjectIds) {
        // Verificar se a disciplina existe
        const [subjectResult] = await req.db.execute(
          'SELECT id FROM subjects WHERE id = ?',
          [subjectId]
        );
        if (subjectResult.length > 0) {
          await req.db.execute(
            'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
            [teacherId, subjectId]
          );
        }
      }

      res.status(200).json({ 
        success: true, 
        message: `${subjectIds.length} disciplinas associadas ao professor.`,
        teacherId,
        subjectIds
      });
    } catch (error) {
      console.error('Erro ao atualizar disciplinas do professor:', error);
      res.status(500).json({ error: 'Erro ao atualizar disciplinas do professor.' });
    }
  },

  // Rota para buscar alunos por disciplina
  getStudentsBySubject: async (req, res) => {
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

      // Buscar alunos matriculados na disciplina específica
      const [rows] = await req.db.execute(`
        SELECT u.id, u.email, p.full_name, p.student_registration, p.grade
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.subject_id = ? AND ur.role = 'student'
        ORDER BY p.full_name
      `, [id]);

      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar alunos por disciplina:', error);
      res.status(500).json({ error: 'Erro ao buscar alunos por disciplina.' });
    }
  }
};
