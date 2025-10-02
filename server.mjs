import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4002; // Porta local configurada para 4002

// Middleware para Content Security Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://r2cdn.perplexity.ai https://fonts.gstatic.com https://fonts.googleapis.com https://*.gstatic.com; connect-src 'self' https:; frame-src 'self'; object-src 'none';");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configurações do CORS para permitir requisições do seu frontend
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos do diretório dist (build do frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// Rota para servir o index.html para todas as rotas que não são API
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    // Se for uma rota da API, continue normalmente
    next();
  } else {
    // Para todas as outras rotas, sirva o index.html
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  }
});

// Configuração da conexão com o banco de dados
console.log('Banco de dados configurado:', process.env.DB_NAME);
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Senha vazia para phpMyAdmin
  database: process.env.DB_NAME || 'josedo64_sisctibalbina',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Rota de teste
app.get('/api', (req, res) => {
  res.send('API do Portal do Curso Técnico está funcionando!');
});

// Rota para criar uma nova disciplina
app.post('/api/subjects', async (req, res) => {
  const { name, description, schedule, max_students, teacher_id, grade } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O nome da disciplina é obrigatório.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar se o professor existe
    if (teacher_id) {
      const [teacherResult] = await connection.execute(
        'SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = ? AND ur.role = ?',
        [teacher_id, 'teacher']
      );
      if (teacherResult.length === 0) {
        return res.status(400).json({ error: 'Professor não encontrado ou não é um professor válido.' });
      }
    }

    // Verificar se a série é válida (aceitando variações) e normalizar
    const validGrades = ['1º Ano', '2º Ano', '3º Ano', '1 Ano', '2 Ano', '3 Ano'];
    let normalizedGrade = grade;
    if (grade) {
      if (!validGrades.includes(grade)) {
        return res.status(400).json({ error: 'Série inválida. Use: 1º Ano, 2º Ano ou 3º Ano.' });
      }
      // Normalizar para o formato com º
      if (grade === '1 Ano') normalizedGrade = '1º Ano';
      else if (grade === '2 Ano') normalizedGrade = '2º Ano';
      else if (grade === '3 Ano') normalizedGrade = '3º Ano';
    }

    await connection.beginTransaction();

    // Inserir a disciplina
    const [result] = await connection.execute(
      'INSERT INTO subjects (name, description, schedule, max_students, teacher_id, grade) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, schedule || null, max_students || 50, teacher_id || null, normalizedGrade || null]
    );

    // Se um professor foi especificado, criar associação na tabela teacher_subjects
    if (teacher_id) {
      await connection.execute(
        'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
        [teacher_id, result.insertId]
      );
    }

    await connection.commit();

    res.status(201).json({ success: true, id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Erro ao inserir disciplina:', error);
    try {
      await connection?.rollback();
    } catch (rollbackError) {
      console.error('Erro ao fazer rollback:', rollbackError);
    }
    res.status(500).json({ error: 'Erro ao conectar ou inserir no banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar todas as disciplinas
app.get('/api/subjects', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
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
    
    const [rows] = await connection.execute(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para deletar uma disciplina
app.delete('/api/subjects/:id', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM subjects WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar disciplina:', error);
    res.status(500).json({ error: 'Erro ao deletar disciplina do banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para criar um novo professor
app.post('/api/teachers', async (req, res) => {
  const { full_name, email, password } = req.body;

  console.log('Recebendo requisição para criar professor:', { full_name, email });

  if (!full_name || !email || !password) {
    console.log('Validação falhou:', { full_name: !!full_name, email: !!email, password: !!password });
    return res.status(400).json({ error: 'Nome completo, email e senha são obrigatórios.' });
  }

  let connection;
  try {
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexão estabelecida, iniciando transação...');
    
    // Iniciar transação para garantir consistência
    await connection.beginTransaction();
    console.log('Transação iniciada');

    // Criar usuário
    console.log('Inserindo usuário...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    console.log('Usuário inserido, ID:', userResult.insertId);

    // Criar perfil
    console.log('Inserindo perfil...');
    await connection.execute(
      'INSERT INTO profiles (user_id, full_name) VALUES (?, ?)',
      [userResult.insertId, full_name]
    );
    console.log('Perfil inserido');

    // Atribuir papel de professor
    console.log('Atribuindo papel de professor...');
    await connection.execute(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userResult.insertId, 'teacher']
    );
    console.log('Papel atribuído');

    console.log('Executando commit da transação...');
    await connection.commit();
    console.log('Transação commitada com sucesso');

    res.status(201).json({ success: true, id: userResult.insertId, full_name, email });
  } catch (error) {
    console.error('Erro na transação - executando rollback:', error.message);
    try {
      await connection?.rollback();
    } catch (rollbackError) {
      console.error('Erro ao fazer rollback:', rollbackError);
    }
    console.error('Erro ao criar professor:', error);
    res.status(500).json({ error: 'Erro ao criar professor no banco de dados.' });
  } finally {
    if (connection) {
      console.log('Fechando conexão...');
      await connection.end();
      console.log('Conexão fechada');
    }
  }
});

// Rota para buscar todos os professores
app.get('/api/teachers', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para atualizar um professor existente
app.put('/api/teachers/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, email, password } = req.body;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Atualizar usuário (email e senha)
    if (email) {
      await connection.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [email, id]
      );
    }

    // Atualizar senha se fornecida
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
    }

    // Atualizar perfil (nome completo)
    await connection.execute(
      'UPDATE profiles SET full_name = ? WHERE user_id = ?',
      [full_name, id]
    );

    await connection.commit();

    res.status(200).json({ success: true, id, full_name, email });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({ error: 'Erro ao atualizar professor no banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para deletar um professor
app.delete('/api/teachers/:id', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar professor:', error);
    res.status(500).json({ error: 'Erro ao deletar professor do banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Função para gerar número de matrícula único
async function generateStudentRegistration(connection) {
  try {
    // Obter o ano atual
    const currentYear = new Date().getFullYear();
    
    // Contar quantos estudantes já foram criados este ano
    const [result] = await connection.execute(`
      SELECT COUNT(*) as count FROM profiles p
      JOIN users u ON p.user_id = u.id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student' AND YEAR(p.created_at) = ?
    `, [currentYear]);
    
    const count = result[0].count || 0;
    const sequenceNumber = (count + 1).toString().padStart(4, '0'); // Padroniza com 4 dígitos
    return `EST${currentYear}${sequenceNumber}`;
  } catch (error) {
    console.error('Erro ao gerar matrícula:', error);
    // Fallback: gerar uma matrícula com timestamp
    return `EST${Date.now().toString().slice(-6)}`;
  }
}

// Rota para criar um novo estudante
app.post('/api/students', async (req, res) => {
  const { fullName, email, password } = req.body;

  console.log('Recebendo requisição para criar estudante:', { fullName, email });

  if (!fullName || !email || !password) {
    console.log('Validação falhou:', { fullName: !!fullName, email: !!email, password: !!password });
    return res.status(400).json({ error: 'Nome completo, email e senha são obrigatórios.' });
  }

  let connection;
  try {
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexão estabelecida, iniciando transação...');
    
    // Iniciar transação para garantir consistência
    await connection.beginTransaction();
    console.log('Transação iniciada');

    // Verificar se o email já existe
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email já está cadastrado.' });
    }

    // Gerar número de matrícula automaticamente
    const studentRegistration = await generateStudentRegistration(connection);
    console.log('Matrícula gerada automaticamente:', studentRegistration);

    // Criar usuário
    console.log('Inserindo usuário...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    console.log('Usuário inserido, ID:', userResult.insertId);

    // Criar perfil
    console.log('Inserindo perfil...');
    await connection.execute(
      'INSERT INTO profiles (user_id, full_name, student_registration) VALUES (?, ?, ?)',
      [userResult.insertId, fullName, studentRegistration]
    );
    console.log('Perfil inserido');

    // Atribuir papel de estudante
    console.log('Atribuindo papel de estudante...');
    await connection.execute(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userResult.insertId, 'student']
    );
    console.log('Papel atribuído');

    console.log('Executando commit da transação...');
    await connection.commit();
    console.log('Transação commitada com sucesso');

    res.status(201).json({ success: true, id: userResult.insertId, fullName, email, studentRegistration });
  } catch (error) {
    console.error('Erro na transação - executando rollback:', error.message);
    try {
      await connection?.rollback();
    } catch (rollbackError) {
      console.error('Erro ao fazer rollback:', rollbackError);
    }
    console.error('Erro ao criar estudante:', error);
    res.status(500).json({ error: 'Erro ao criar estudante no banco de dados.' });
  } finally {
    if (connection) {
      console.log('Fechando conexão...');
      await connection.end();
      console.log('Conexão fechada');
    }
  }
});

// Rota para buscar todos os estudantes
app.get('/api/students', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT u.id, u.email, p.full_name, p.student_registration, p.grade, u.created_at
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'student'
      ORDER BY u.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar estudantes:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar um estudante específico
app.get('/api/students/:id', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
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
  } catch (error) {
    console.error('Erro ao buscar estudante:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para atualizar um estudante existente
app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, studentRegistration, password, grade } = req.body;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Atualizar usuário (email e senha)
    if (email) {
      await connection.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [email, id]
      );
    }

    // Atualizar senha se fornecida
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
    }

    // Atualizar perfil (nome completo, matrícula e série)
    await connection.execute(
      'UPDATE profiles SET full_name = ?, student_registration = ?, grade = ? WHERE user_id = ?',
      [fullName, studentRegistration, grade, id]
    );

    await connection.commit();

    res.status(200).json({ success: true, id, fullName, email, studentRegistration, grade });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar estudante:', error);
    res.status(500).json({ error: 'Erro ao atualizar estudante no banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para atualizar a senha de um estudante
app.put('/api/students/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password, newPassword } = req.body;

  // Aceitar tanto 'password' quanto 'newPassword' para compatibilidade
  const newPasswordValue = password || newPassword;
  
  if (!newPasswordValue) {
    return res.status(400).json({ error: 'Senha é obrigatória.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(newPasswordValue, 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar senha do estudante:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha no banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para deletar um estudante
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar estudante:', error);
    res.status(500).json({ error: 'Erro ao deletar estudante do banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para atualizar o papel de um usuário
app.put('/api/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validar o papel
  const validRoles = ['admin', 'student', 'teacher'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Papel inválido. Use: admin, student ou teacher.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar se o usuário existe
    const [userResult] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    if (userResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Remover papéis antigos do usuário
    await connection.execute(
      'DELETE FROM user_roles WHERE user_id = ?',
      [id]
    );

    // Atribuir novo papel
    await connection.execute(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [id, role]
    );

    await connection.commit();

    res.status(200).json({ success: true, id, role });
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    try {
      await connection?.rollback();
    } catch (rollbackError) {
      console.error('Erro ao fazer rollback:', rollbackError);
    }
    res.status(500).json({ error: 'Erro ao atualizar papel do usuário no banco de dados.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar todos os usuários (com seus papéis)
app.get('/api/users', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT u.id, u.email, u.created_at, p.full_name, p.student_registration
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);
    
    // Para cada usuário, buscar seus papéis
    const usersWithRoles = await Promise.all(rows.map(async (user) => {
      const [roles] = await connection.execute(
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para cadastro de novo usuário
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, studentRegistration } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, senha e nome completo são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar se o email já existe
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email já está cadastrado.' });
    }

    // Gerar número de matrícula automaticamente se não for fornecido (para estudantes)
    let registrationToUse = studentRegistration;
    if (!registrationToUse) {
      // Gerar matrícula automaticamente
      const currentYear = new Date().getFullYear();
      const [result] = await connection.execute(`
        SELECT COUNT(*) as count FROM profiles p
        JOIN users u ON p.user_id = u.id
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role = 'student' AND YEAR(p.created_at) = ?
      `, [currentYear]);
      
      const count = result[0].count || 0;
      const sequenceNumber = (count + 1).toString().padStart(4, '0');
      registrationToUse = `EST${currentYear}${sequenceNumber}`;
    }

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    // Criar perfil
    await connection.execute(
      'INSERT INTO profiles (user_id, full_name, student_registration) VALUES (?, ?, ?)',
      [userResult.insertId, fullName, registrationToUse]
    );

    // Atribuir papel de estudante por padrão
    await connection.execute(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userResult.insertId, 'student']
    );

    await connection.commit();

    // Criar sessão (usando um cookie simples para esta implementação)
    res.cookie('sessionId', userResult.insertId, {
      httpOnly: true,
      secure: false, // Em produção, usar true com HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: 'strict'
    });

    // Retornar informações do usuário criado
    res.status(201).json({
      success: true,
      user: {
        id: userResult.insertId.toString(),
        email: email,
        role: 'student',
        full_name: fullName
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    try {
      await connection?.rollback();
    } catch (rollbackError) {
      console.error('Erro ao fazer rollback:', rollbackError);
    }
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para login de usuário
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar usuário e suas informações
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.password, p.full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.email = ?
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = users[0];

    // Verificar senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta. Por favor, verifique sua senha e tente novamente.' });
    }

    // Buscar papel do usuário
    const [roles] = await connection.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );

    const userRole = roles.length > 0 ? roles[0].role : 'student';

    // Criar sessão (usando um cookie simples para esta implementação)
    res.cookie('sessionId', user.id, {
      httpOnly: true,
      secure: false, // Em produção, usar true com HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: 'strict'
    });

    // Retornar informações do usuário
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para obter informações do usuário atual (baseado na sessão)
app.get('/api/auth/me', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar informações do usuário baseado na sessão
    const [users] = await connection.execute(`
      SELECT u.id, u.email, p.full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `, [sessionId]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const user = users[0];

    // Buscar papel do usuário
    const [roles] = await connection.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );

    const userRole = roles.length > 0 ? roles[0].role : 'student';

    res.status(200).json({
      id: user.id,
      email: user.email,
      role: userRole,
      full_name: user.full_name
    });
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    res.status(500).json({ error: 'Erro ao obter informações do usuário.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar disciplinas do estudante
app.get('/api/students/:id/subjects', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar disciplinas do estudante através da tabela de matrículas
    const [rows] = await connection.execute(`
      SELECT s.*, p.full_name as teacher_name, e.enrollment_date
      FROM subjects s
      INNER JOIN enrollments e ON s.id = e.subject_id
      LEFT JOIN profiles p ON s.teacher_id = p.user_id
      WHERE e.student_id = ?
      ORDER BY s.created_at DESC
    `, [id]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar disciplinas do estudante:', error);
    res.status(500).json({ error: 'Erro ao buscar disciplinas do estudante.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para logout
app.post('/api/auth/logout', async (req, res) => {
  res.clearCookie('sessionId');
  res.status(200).json({ success: true });
});

// Rota para buscar disciplinas do professor (usando tabela de associação teacher_subjects)
app.get('/api/teachers/:id/subjects', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Converter o ID para número inteiro para garantir compatibilidade com o banco de dados
    const teacherId = parseInt(id);
    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'ID do professor inválido.' });
    }
    
    // Buscar disciplinas associadas ao professor através da tabela teacher_subjects
    const [rows] = await connection.execute(`
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar alunos de um professor (através das disciplinas)
app.get('/api/teachers/:id/students', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar alunos matriculados nas disciplinas do professor
    const [rows] = await connection.execute(`
      SELECT DISTINCT u.id, u.email, p.full_name, p.student_registration, p.grade, e.subject_id, s.name as subject_name, s.grade as subject_grade
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
    res.status(50).json({ error: 'Erro ao buscar alunos do professor.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar alunos filtrados por série
app.get('/api/students/grade/:grade', async (req, res) => {
  const { grade } = req.params;

  // Validar a série
  const validGrades = ['1º Ano', '2º Ano', '3º Ano'];
  if (!validGrades.includes(grade)) {
    return res.status(400).json({ error: 'Série inválida. Use: 1º Ano, 2º Ano ou 3º Ano.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar alunos da série específica
    const [rows] = await connection.execute(`
      SELECT u.id, u.email, p.full_name, p.student_registration, p.grade
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE p.grade = ? AND ur.role = 'student'
      ORDER BY p.full_name
    `, [grade]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar alunos por série:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos por série.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para associar disciplinas a um professor (muitos-para-muitos)
app.post('/api/teachers/:teacherId/subjects', async (req, res) => {
  const { teacherId } = req.params;
  const { subjectIds } = req.body; // Array de IDs de disciplinas

  if (!subjectIds || !Array.isArray(subjectIds)) {
    return res.status(400).json({ error: 'subjectIds deve ser um array de IDs de disciplinas.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar se o professor existe
    const [teacherResult] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?)',
      [teacherId, teacherId, 'teacher']
    );
    if (teacherResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }

    // Associar cada disciplina ao professor
    for (const subjectId of subjectIds) {
      // Verificar se a disciplina existe
      const [subjectResult] = await connection.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [subjectId]
      );
      if (subjectResult.length > 0) {
        // Inserir ou atualizar associação (ON DUPLICATE KEY UPDATE)
        await connection.execute(`
          INSERT INTO teacher_subjects (teacher_id, subject_id) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
        `, [teacherId, subjectId]);
      }
    }

    await connection.commit();

    res.status(200).json({ 
      success: true, 
      message: `${subjectIds.length} disciplinas associadas ao professor.`,
      teacherId,
      subjectIds
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao associar disciplinas ao professor:', error);
    res.status(500).json({ error: 'Erro ao associar disciplinas ao professor.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para remover associação de disciplina com professor
app.delete('/api/teachers/:teacherId/subjects/:subjectId', async (req, res) => {
  const { teacherId, subjectId } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Remover a associação da tabela teacher_subjects
    const [result] = await connection.execute(
      'DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?',
      [teacherId, subjectId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Associação não encontrada.' });
    }

    await connection.commit();

    res.status(200).json({ 
      success: true, 
      message: 'Disciplina removida do professor.',
      teacherId,
      subjectId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao remover associação de disciplina com professor:', error);
    res.status(500).json({ error: 'Erro ao remover associação de disciplina com professor.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para atualizar todas as disciplinas de um professor (substituir completamente)
app.put('/api/teachers/:teacherId/subjects', async (req, res) => {
  const { teacherId } = req.params;
  const { subjectIds } = req.body; // Array de IDs de disciplinas

  if (!subjectIds || !Array.isArray(subjectIds)) {
    return res.status(400).json({ error: 'subjectIds deve ser um array de IDs de disciplinas.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar se o professor existe
    const [teacherResult] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?)',
      [teacherId, teacherId, 'teacher']
    );
    if (teacherResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }

    // Remover todas as associações atuais
    await connection.execute(
      'DELETE FROM teacher_subjects WHERE teacher_id = ?',
      [teacherId]
    );

    // Associar as novas disciplinas
    for (const subjectId of subjectIds) {
      // Verificar se a disciplina existe
      const [subjectResult] = await connection.execute(
        'SELECT id FROM subjects WHERE id = ?',
        [subjectId]
      );
      if (subjectResult.length > 0) {
        await connection.execute(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
          [teacherId, subjectId]
        );
      }
    }

    await connection.commit();

    res.status(200).json({ 
      success: true, 
      message: `${subjectIds.length} disciplinas associadas ao professor.`,
      teacherId,
      subjectIds
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar disciplinas do professor:', error);
    res.status(500).json({ error: 'Erro ao atualizar disciplinas do professor.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar atividades pendentes (atividades que precisam de atenção)
app.get('/api/teachers/:id/activities/pending', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar informações sobre atividades pendentes baseadas nas disciplinas do professor
    // Vamos retornar informações sobre alunos matriculados que ainda não têm notas registradas
    const [rows] = await connection.execute(`
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Rota para buscar eventos do calendário do professor
app.get('/api/teachers/:id/calendar', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar se a tabela calendar_events existe
    const [tableCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'calendar_events'
    `, [dbConfig.database]);
    
    console.log('Verificação da tabela calendar_events:', tableCheck[0].count);
    
    if (tableCheck[0].count === 0) {
      // Se a tabela não existe, retornar array vazio
      console.log('Tabela calendar_events não existe, retornando array vazio');
      return res.status(200).json([]);
    }
    
    // Buscar eventos relacionados às disciplinas do professor
    const [rows] = await connection.execute(`
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Middleware para verificar autenticação (opcional)
const requireAuth = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [sessionId]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }
    
    req.userId = sessionId;
    next();
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    res.status(500).json({ error: 'Erro na verificação de autenticação.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Aplicar middleware de autenticação às rotas que precisam de login
// app.use('/api/protected', requireAuth); // Exemplo de uso

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
