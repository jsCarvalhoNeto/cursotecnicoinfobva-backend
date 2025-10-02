import { hashPassword } from './baseController.js';

// Função para criar um novo professor
export const create = async (req, res) => {
  const { full_name, email, password } = req.body;

  console.log('Recebendo requisição para criar professor:', { full_name, email });

  if (!full_name || !email || !password) {
    console.log('Validação falhou:', { full_name: !!full_name, email: !!email, password: !!password });
    return res.status(400).json({ error: 'Nome completo, email e senha são obrigatórios.' });
  }

  try {
    // Verificar se o email já existe
    const [existingUser] = await req.db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já está cadastrado.' });
    }

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
      'INSERT INTO profiles (user_id, full_name) VALUES (?, ?)',
      [userResult.insertId, full_name]
    );
    console.log('Perfil inserido');

    // Atribuir papel de professor
    console.log('Atribuindo papel de professor...');
    await req.db.execute(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userResult.insertId, 'teacher']
    );
    console.log('Papel atribuído');

    res.status(201).json({ success: true, id: userResult.insertId, full_name, email });
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    res.status(500).json({ error: 'Erro ao criar professor no banco de dados.' });
  }
};

// Função para buscar todos os professores
export const getAll = async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
      SELECT u.id, u.email, p.full_name, u.created_at
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'teacher'
      ORDER BY u.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
  }
};

// Função para atualizar um professor existente
export const update = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, password } = req.body;

  try {
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

    // Atualizar perfil (nome completo)
    await req.db.execute(
      'UPDATE profiles SET full_name = ? WHERE user_id = ?',
      [full_name, id]
    );

    res.status(200).json({ success: true, id, full_name, email });
  } catch (error) {
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({ error: 'Erro ao atualizar professor no banco de dados.' });
  }
};

// Função para deletar um professor
export const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    await req.db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar professor:', error);
    res.status(500).json({ error: 'Erro ao deletar professor do banco de dados.' });
  }
};

// Função para buscar disciplinas do professor (usando tabela de associação teacher_subjects)
export const getSubjects = async (req, res) => {
  const { id } = req.params;

  try {
    // Converter o ID para número inteiro para garantir compatibilidade com o banco de dados
    const teacherId = parseInt(id);
    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'ID do professor inválido.' });
    }
    
    // Buscar disciplinas associadas ao professor através da tabela teacher_subjects
    const [rows] = await req.db.execute(`
      SELECT s.*, p.full_name as teacher_name,
             ts.assigned_at,
             (SELECT COUNT(*) FROM enrollments e WHERE e.subject_id = s.id) as current_students
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      WHERE ts.teacher_id = ?
      ORDER BY s.created_at DESC
    `, [teacherId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar disciplinas do professor:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas do professor.' });
  }
};

// Função para buscar alunos de um professor (através das disciplinas)
export const getStudents = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar alunos matriculados nas disciplinas do professor (sem duplicatas)
    const [rows] = await req.db.execute(`
      SELECT DISTINCT u.id, u.email, p.full_name, p.student_registration, p.grade
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN enrollments e ON u.id = e.student_id
      JOIN subjects s ON e.subject_id = s.id
      WHERE s.teacher_id = ? AND ur.role = 'student'
      ORDER BY p.full_name
    `, [id]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar alunos do professor:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos do professor.' });
  }
};

// Função para buscar atividades pendentes (atividades que precisam de atenção)
export const getPendingActivities = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar informações sobre atividades pendentes baseadas nas disciplinas do professor
    // Vamos retornar informações sobre alunos matriculados que ainda não têm notas registradas
    const [rows] = await req.db.execute(`
      SELECT s.id as subject_id, s.name as subject_name, 
             COUNT(e.id) as total_students, 
             COUNT(g.id) as graded_students,
             (COUNT(e.id) - COUNT(g.id)) as pending_grades
      FROM subjects s
      LEFT JOIN enrollments e ON s.id = e.subject_id
      LEFT JOIN grades g ON e.id = g.enrollment_id
      WHERE s.teacher_id = ?
      GROUP BY s.id, s.name
      HAVING pending_grades > 0
      ORDER BY s.name
    `, [id]);

    // Transformar os resultados para o formato esperado pelo frontend
    const activities = rows.map(row => ({
      id: `subject-${row.subject_id}`,
      title: `Notas pendentes - ${row.subject_name}`,
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      student_count: row.total_students,
      graded_count: row.graded_students
    }));

    res.status(200).json(activities);
  } catch (error) {
    console.error('Erro ao buscar atividades pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades pendentes.' });
  }
};

// Função para buscar eventos do calendário do professor
export const getCalendarEvents = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se a tabela calendar_events existe
    const [tableCheck] = await req.db.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'calendar_events'
    `, [process.env.DB_NAME]);
    
    console.log('Verificação da tabela calendar_events:', tableCheck[0].count);
    
    if (tableCheck[0].count === 0) {
      // Se a tabela não existe, retornar array vazio
      console.log('Tabela calendar_events não existe, retornando array vazio');
      return res.status(200).json([]);
    }
    
    // Buscar eventos relacionados às disciplinas do professor
    const [rows] = await req.db.execute(`
      SELECT c.id, c.title, c.date, c.time, c.type, c.description, s.id as subject_id, s.name as subject_name
      FROM calendar_events c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE s.teacher_id = ? OR c.created_by = ?
      ORDER BY c.date, c.time
    `, [id, id]);

    console.log('Eventos encontrados:', rows.length);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    res.status(500).json({ error: 'Erro ao buscar eventos do calendário.' });
  }
};

// Função para atualizar a senha de um professor
export const updatePassword = async (req, res) => {
  const { id } = req.params;
  const { password, newPassword } = req.body;

  // Aceitar tanto 'password' quanto 'newPassword' para compatibilidade
  const newPasswordValue = password || newPassword;
  
  if (!newPasswordValue) {
    return res.status(400).json({ error: 'Senha é obrigatória.' });
  }

  try {
    const hashedPassword = await hashPassword(newPasswordValue);
    await req.db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar senha do professor:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha no banco de dados.' });
  }
};
