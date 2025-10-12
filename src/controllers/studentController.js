import { hashPassword, generateStudentRegistration } from './baseController.js';

// Controller para estudantes
export const studentController = {
  // Rota para criar um novo estudante
 create: async (req, res) => {
    const { fullName, email, password, grade } = req.body;

    console.log('Recebendo requisição para criar estudante:', { fullName, email, grade });

    if (!fullName || !email || !password) {
      console.log('Validação falhou:', { fullName: !!fullName, email: !!email, password: !!password, grade: !!grade });
      return res.status(400).json({ error: 'Nome completo, email e senha são obrigatórios.' });
    }

    try {
      if (req.dbType === 'mysql') {
        // Verificar se o email já existe
        const [existingUser] = await req.db.execute(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );
        if (existingUser.length > 0) {
          return res.status(400).json({ error: 'Email já está cadastrado.' });
        }

        // Gerar número de matrícula automaticamente
        const studentRegistration = await generateStudentRegistration(req.db);
        console.log('Matrícula gerada automaticamente:', studentRegistration);

        // Criar usuário
        console.log('Inserindo usuário...');
        const hashedPassword = await hashPassword(password);
        const [userResult] = await req.db.execute(
          'INSERT INTO users (email, password) VALUES (?, ?)',
          [email, hashedPassword]
        );
        console.log('Usuário inserido, ID:', userResult.insertId);

        // Criar perfil
        console.log('Inserindo perfil...');
        await req.db.execute(
          'INSERT INTO profiles (user_id, full_name, student_registration, grade) VALUES (?, ?, ?, ?)',
          [userResult.insertId, fullName, studentRegistration, grade || null]
        );
        console.log('Perfil inserido');

        // Atribuir papel de estudante
        console.log('Atribuindo papel de estudante...');
        await req.db.execute(
          'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
          [userResult.insertId, 'student']
        );
        console.log('Papel atribuído');

        // Se a série foi definida, matricular o aluno automaticamente em todas as disciplinas da série
        if (grade) {
          console.log('Matriculando aluno automaticamente nas disciplinas da série:', grade);
          const [subjects] = await req.db.execute(
            'SELECT id FROM subjects WHERE grade = ?',
            [grade]
          );
          
          for (const subject of subjects) {
            await req.db.execute(
              'INSERT IGNORE INTO enrollments (student_id, subject_id) VALUES (?, ?)',
              [userResult.insertId, subject.id]
            );
          }
          console.log(`Matrícula automática concluída para ${subjects.length} disciplinas`);
        }

        console.log('Executando commit da transação...');

        res.status(201).json({ success: true, id: userResult.insertId, fullName, email, studentRegistration, grade });
      } else {
        // Lógica para banco de dados mockado
        const existingUser = req.db.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: 'Email já está cadastrado.' });
        }

        const studentRegistration = `2024INFO${Date.now().toString().slice(-4)}`;
        const hashedPassword = await hashPassword(password);
        const newUser = req.db.addUser({
          email,
          password: hashedPassword,
          role: 'student',
          fullName,
          registration: studentRegistration
        });

        req.db.addProfile({
          user_id: newUser.id,
          full_name: fullName,
          email: email,
          student_registration: studentRegistration,
          grade: grade || null
        });

        req.db.addRole({
          user_id: newUser.id,
          role: 'student'
        });

        res.status(201).json({ success: true, id: newUser.id, fullName, email, studentRegistration, grade });
      }
    } catch (error) {
      console.error('Erro ao criar estudante:', error);
      res.status(500).json({ error: 'Erro ao criar estudante no banco de dados.' });
    }
  },

  // Rota para buscar todos os estudantes
 getAll: async (req, res) => {
    try {
      if (req.dbType === 'mysql') {
        const [rows] = await req.db.execute(`
          SELECT u.id, u.email, p.full_name, p.student_registration, p.grade, u.created_at
          FROM users u
          JOIN profiles p ON u.id = p.user_id
          JOIN user_roles ur ON u.id = ur.user_id
          WHERE ur.role = 'student'
          ORDER BY u.created_at DESC
        `);
        res.status(200).json(rows);
      } else {
        const students = req.db.getAllStudents();
        res.status(200).json(students);
      }
    } catch (error) {
      console.error('Erro ao buscar estudantes:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
    }
 },

  // Rota para buscar um estudante específico
  getById: async (req, res) => {
    const { id } = req.params;

    try {
      if (req.dbType === 'mysql') {
        const [rows] = await req.db.execute(`
          SELECT u.id, u.email, u.password, p.full_name, p.student_registration, p.grade, u.created_at
          FROM users u
          JOIN profiles p ON u.id = p.user_id
          JOIN user_roles ur ON u.id = ur.user_id
          WHERE ur.role = 'student' AND u.id = ?
        `, [id]);

        if (rows.length === 0) {
          return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        res.status(200).json(rows[0]);
      } else {
        const student = req.db.getUserById(id);
        if (!student) {
          return res.status(404).json({ error: 'Estudante não encontrado.' });
        }
        const profile = req.db.getProfileByUserId(id);
        const roles = req.db.getRolesByUserId(id);
        const response = { ...student, ...profile, roles };
        res.status(200).json(response);
      }
    } catch (error) {
      console.error('Erro ao buscar estudante:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
    }
  },

   // Rota para atualizar um estudante existente
  update: async (req, res) => {
    const { id } = req.params;
    const { fullName, email, studentRegistration, password, grade } = req.body;

    try {
      if (req.dbType === 'mysql') {
        // Atualizar usuário (email e senha)
        if (email) {
          await req.db.execute(
            'UPDATE users SET email = ? WHERE id = ?',
            [email, id]
          );
        }

        // Atualizar senha se fornecida
        if (password) {
          const hashedPassword = await hashPassword(password);
          await req.db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
          );
        }

        // Atualizar perfil (nome completo, matrícula e série)
        await req.db.execute(
          'UPDATE profiles SET full_name = ?, student_registration = ?, grade = ? WHERE user_id = ?',
          [fullName, studentRegistration, grade, id]
        );

        // Se a série foi alterada, atualizar as matrículas automaticamente
        if (grade !== undefined) {
          // Buscar a série atual do aluno
          const [currentProfile] = await req.db.execute(
            'SELECT grade FROM profiles WHERE user_id = ?',
            [id]
          );

          const currentGrade = currentProfile.length > 0 ? currentProfile[0].grade : null;

          // Apenas atualizar matrículas se a série realmente mudou
          if (grade !== currentGrade) {
            console.log('Atualizando matrículas do aluno para a nova série:', grade);
            
            // Remover matrículas de disciplinas associadas à série anterior
            if (currentGrade) {
              await req.db.execute(`
                DELETE e FROM enrollments e
                JOIN subjects s ON e.subject_id = s.id
                WHERE e.student_id = ? AND s.grade = ?
              `, [id, currentGrade]);
            }
            
            // Se a nova série não for nula, adicionar novas matrículas
            if (grade) {
              const [subjects] = await req.db.execute(
                'SELECT id FROM subjects WHERE grade = ?',
                [grade]
              );
              
              for (const subject of subjects) {
                await req.db.execute(
                  'INSERT IGrove INTO enrollments (student_id, subject_id) VALUES (?, ?)',
                  [id, subject.id]
                );
              }
              console.log(`Matrículas atualizadas para ${subjects.length} disciplinas da série ${grade}`);
            }
          }
        }
      } else {
        // Lógica para banco de dados mockado
        if (password) {
          const hashedPassword = await hashPassword(password);
          req.db.updateUserPassword(id, hashedPassword);
        }
        
        req.db.updateProfile(id, {
          full_name: fullName,
          email: email,
          student_registration: studentRegistration,
          grade: grade
        });
      }

      res.status(200).json({ success: true, id, fullName, email, studentRegistration, grade });
    } catch (error) {
      console.error('Erro ao atualizar estudante:', error);
      res.status(500).json({ error: 'Erro ao atualizar estudante no banco de dados.' });
    }
  },

  // Rota para atualizar a senha de um estudante
  updatePassword: async (req, res) => {
    const { id } = req.params;
    const { password, newPassword } = req.body;

    // Aceitar tanto 'password' quanto 'newPassword' para compatibilidade
    const newPasswordValue = password || newPassword;
    
    if (!newPasswordValue) {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }

    try {
      if (req.dbType === 'mysql') {
        const hashedPassword = await hashPassword(newPasswordValue);
        await req.db.execute(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, id]
        );
      } else {
        const hashedPassword = await hashPassword(newPasswordValue);
        req.db.updateUserPassword(id, hashedPassword);
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao atualizar senha do estudante:', error);
      res.status(500).json({ error: 'Erro ao atualizar senha no banco de dados.' });
    }
  },

  // Rota para deletar um estudante
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      if (req.dbType === 'mysql') {
        await req.db.execute('DELETE FROM users WHERE id = ?', [id]);
      } else {
        req.db.removeUser(id);
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar estudante:', error);
      res.status(500).json({ error: 'Erro ao deletar estudante do banco de dados.' });
    }
  },

  // Rota para buscar disciplinas do estudante
  getSubjects: async (req, res) => {
    const { id } = req.params;

    try {
      if (req.dbType === 'mysql') {
        // Buscar disciplinas do estudante através da tabela de matrículas
        const [rows] = await req.db.execute(`
          SELECT s.*, p.full_name as teacher_name, e.enrollment_date
          FROM subjects s
          INNER JOIN enrollments e ON s.id = e.subject_id
          LEFT JOIN profiles p ON s.teacher_id = p.user_id
          WHERE e.student_id = ?
          ORDER BY s.created_at DESC
        `, [id]);

        res.status(200).json(rows);
      } else {
        // Lógica para banco de dados mockado
        // Esta funcionalidade não está implementada no mock
        res.status(200).json([]);
      }
    } catch (error) {
      console.error('Erro ao buscar disciplinas do estudante:', error);
      res.status(500).json({ error: 'Erro ao buscar disciplinas do estudante.' });
    }
  },

  // Rota para buscar alunos filtrados por série
 getByGrade: async (req, res) => {
    const { grade } = req.params;

    // Validar a série
    const validGrades = ['1º Ano', '2º Ano', '3º Ano'];
    if (!validGrades.includes(grade)) {
      return res.status(400).json({ error: 'Série inválida. Use: 1º Ano, 2º Ano ou 3º Ano.' });
    }

    try {
      if (req.dbType === 'mysql') {
        // Buscar alunos da série específica
        const [rows] = await req.db.execute(`
          SELECT u.id, u.email, p.full_name, p.student_registration, p.grade
          FROM users u
          JOIN profiles p ON u.id = p.user_id
          JOIN user_roles ur ON u.id = ur.user_id
          WHERE p.grade = ? AND ur.role = 'student'
          ORDER BY p.full_name
        `, [grade]);

        res.status(200).json(rows);
      } else {
        // Lógica para banco de dados mockado
        const students = req.db.getAllStudents().filter(s => s.grade === grade);
        res.status(200).json(students);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos por série:', error);
      res.status(500).json({ error: 'Erro ao buscar alunos por série.' });
    }
  },

  // Rota para matricular estudante em uma disciplina
  enrollInSubject: async (req, res) => {
    const { id } = req.params; // student_id
    const { subjectId } = req.body;

    if (!subjectId) {
      return res.status(400).json({ error: 'ID da disciplina é obrigatório.' });
    }

    try {
      if (req.dbType === 'mysql') {
        // Verificar se o estudante existe
        const [studentRows] = await req.db.execute(
          'SELECT id FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = ? AND ur.role = "student"',
          [id]
        );
        if (studentRows.length === 0) {
          return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        // Verificar se a disciplina existe
        const [subjectRows] = await req.db.execute(
          'SELECT id FROM subjects WHERE id = ?',
          [subjectId]
        );
        if (subjectRows.length === 0) {
          return res.status(404).json({ error: 'Disciplina não encontrada.' });
        }

        // Tentar inserir a matrícula (ignorar se já existir)
        const [result] = await req.db.execute(
          'INSERT IGNORE INTO enrollments (student_id, subject_id) VALUES (?, ?)',
          [id, subjectId]
        );

        if (result.affectedRows > 0) {
          res.status(201).json({ success: true, message: 'Estudante matriculado com sucesso.' });
        } else {
          res.status(200).json({ success: true, message: 'Estudante já estava matriculado nesta disciplina.' });
        }
      } else {
        // Lógica para banco de dados mockado
        res.status(200).json({ success: true, message: 'Matrícula simulada com sucesso.' });
      }
    } catch (error) {
      console.error('Erro ao matricular estudante:', error);
      res.status(500).json({ error: 'Erro ao matricular estudante na disciplina.' });
    }
  },

  // Rota para remover matrícula de estudante em uma disciplina
  removeFromSubject: async (req, res) => {
    const { id } = req.params; // student_id
    const { subjectId } = req.body;

    if (!subjectId) {
      return res.status(400).json({ error: 'ID da disciplina é obrigatório.' });
    }

    try {
      if (req.dbType === 'mysql') {
        // Verificar se a matrícula existe
        const [enrollmentRows] = await req.db.execute(
          'SELECT id FROM enrollments WHERE student_id = ? AND subject_id = ?',
          [id, subjectId]
        );
        if (enrollmentRows.length === 0) {
          return res.status(404).json({ error: 'Matrícula não encontrada.' });
        }

        // Remover a matrícula
        await req.db.execute(
          'DELETE FROM enrollments WHERE student_id = ? AND subject_id = ?',
          [id, subjectId]
        );

        res.status(200).json({ success: true, message: 'Matrícula removida com sucesso.' });
      } else {
        // Lógica para banco de dados mockado
        res.status(200).json({ success: true, message: 'Remoção de matrícula simulada com sucesso.' });
      }
    } catch (error) {
      console.error('Erro ao remover matrícula do estudante:', error);
      res.status(500).json({ error: 'Erro ao remover matrícula do estudante.' });
    }
  },

  // Rota para buscar todas as disciplinas disponíveis para matrícula
  getAvailableSubjects: async (req, res) => {
    const { id } = req.params; // student_id

    try {
      if (req.dbType === 'mysql') {
        // Buscar todas as disciplinas que o estudante NÃO está matriculado
        const [rows] = await req.db.execute(`
          SELECT s.*, p.full_name as teacher_name
          FROM subjects s
          LEFT JOIN profiles p ON s.teacher_id = p.user_id
          WHERE s.id NOT IN (
            SELECT e.subject_id FROM enrollments e WHERE e.student_id = ?
          )
          ORDER BY s.name
        `, [id]);

        res.status(200).json(rows);
      } else {
        // Lógica para banco de dados mockado
        res.status(200).json([]);
      }
    } catch (error) {
      console.error('Erro ao buscar disciplinas disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar disciplinas disponíveis.' });
    }
  }
};
