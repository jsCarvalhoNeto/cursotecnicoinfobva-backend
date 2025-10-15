// Função para tratamento de erros
const handleError = (res, error) => {
  console.error('Erro no controller:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
};

// Nova função para criar nota de atividade
export const createActivityGrade = async (req, res) => {
  try {
    console.log('Recebendo requisição para criar nota de atividade:', req.body);
    console.log('User ID autenticado:', req.userId);
    
    const { activity_id, enrollment_id, grade, student_name, team_members } = req.body;
    const teacher_id = req.userId; // ID do professor autenticado

    // Verifica se o professor existe usando os papéis já verificados no middleware
    if (!req.userRoles.includes('teacher')) {
      console.log('Professor não encontrado ou não é professor:', teacher_id);
      return res.status(403).json({ error: 'Acesso negado. Usuário não é um professor' });
    }

    // Verificar se atividade existe e pertence ao professor
    const activityQuery = `
      SELECT a.id, a.teacher_id
      FROM activities a
      WHERE a.id = ? AND a.teacher_id = ?
    `;
    const [activityResult] = await req.db.execute(activityQuery, [activity_id, teacher_id]);

    if (activityResult.length === 0) {
      console.log('Atividade não encontrada ou não pertence ao professor:', activity_id, teacher_id);
      return res.status(404).json({ error: 'Atividade não encontrada ou não pertence ao professor' });
    }

    // Verificar se a matrícula existe e está relacionada à disciplina da atividade
    const enrollmentQuery = `
      SELECT e.id
      FROM enrollments e
      JOIN activities a ON e.subject_id = a.subject_id
      WHERE e.id = ? AND a.id = ?
    `;
    const [enrollmentResult] = await req.db.execute(enrollmentQuery, [enrollment_id, activity_id]);

    if (enrollmentResult.length === 0) {
      console.log('Matrícula não encontrada ou não está relacionada à atividade:', enrollment_id, activity_id);
      return res.status(404).json({ error: 'Matrícula não encontrada ou não está relacionada à atividade' });
    }

    // Verificar se já existe uma submissão para esta atividade e aluno
    const existingSubmissionQuery = `
      SELECT id FROM activity_grades
      WHERE activity_id = ? AND enrollment_id = ?
    `;
    const [existingResult] = await req.db.execute(existingSubmissionQuery, [activity_id, enrollment_id]);
    
    if (existingResult.length > 0) {
      console.log('Já existe uma submissão para esta atividade e aluno:', activity_id, enrollment_id);
      return res.status(409).json({ error: 'Esta atividade já tem uma submissão para este aluno' });
    }

    // Inserir a nova nota - usando apenas colunas que existem na tabela
    const insertQuery = `
      INSERT INTO activity_grades (activity_id, enrollment_id, grade, graded_by, student_name, team_members)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await req.db.execute(insertQuery, [
      activity_id,
      enrollment_id,
      grade || null,
      teacher_id,
      student_name || null,
      team_members || null
    ]);

    // Retornar a nota criada
    const selectQuery = `
      SELECT 
        ag.*,
        a.name as activity_name,
        s.name as subject_name,
        p.full_name as student_name_display,
        u.email as student_email
      FROM activity_grades ag
      JOIN enrollments e ON ag.enrollment_id = e.id
      JOIN activities a ON ag.activity_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON e.student_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE ag.id = ?
    `;
    const [createdResult] = await req.db.execute(selectQuery, [result.insertId]);

    console.log('Nota criada com sucesso:', createdResult[0]);

    res.status(201).json(createdResult[0]);
  } catch (error) {
    console.error('Erro ao criar nota da atividade:', error);
    console.error('Stack do erro:', error.stack);
    handleError(res, error);
  }
};

// Nova função para atualizar nota de atividade
export const updateActivityGrade = async (req, res) => {
  try {
    console.log('Recebendo requisição para atualizar nota da atividade:', req.body);
    console.log('Grade ID:', req.params.id);
    console.log('User ID autenticado:', req.userId);
    
    const { id } = req.params;
    const { grade } = req.body; // Removido status e feedback que não existem na tabela
    const teacher_id = req.userId; // ID do professor autenticado

    // Verifica se o professor existe usando os papéis já verificados no middleware
    if (!req.userRoles.includes('teacher')) {
      console.log('Professor não encontrado ou não é professor:', teacher_id);
      return res.status(403).json({ error: 'Acesso negado. Usuário não é um professor' });
    }

    // Verificar se a nota existe e pertence a uma atividade do professor
    // Primeiro, vamos obter informações sobre a nota e a atividade associada
    const gradeQuery = `
      SELECT ag.id, ag.activity_id, a.teacher_id, a.name as activity_name, a.subject_id
      FROM activity_grades ag
      JOIN activities a ON ag.activity_id = a.id
      WHERE ag.id = ?
    `;
    const [gradeResult] = await req.db.execute(gradeQuery, [id]);

    if (gradeResult.length === 0) {
      console.log('Nota não encontrada:', id);
      return res.status(404).json({ error: 'Nota não encontrada' });
    }

    const gradeRecord = gradeResult[0];

    console.log('Verificação de permissão para atualizar nota:');
    console.log('- Grade ID:', id);
    console.log('- Activity ID:', gradeRecord.activity_id);
    console.log('- Activity Teacher ID (dono da atividade):', gradeRecord.teacher_id);
    console.log('- Professor autenticado (teacher_id):', teacher_id);
    console.log('- Activity Name:', gradeRecord.activity_name);
    console.log('- Subject ID:', gradeRecord.subject_id);

    // Verificar se a atividade pertence ao professor
    // A verificação pode ser feita de duas formas: pelo teacher_id da atividade ou pela associação professor-disciplina
    const activityCheckQuery = `
      SELECT a.id, a.teacher_id, a.subject_id, ts.teacher_id as subject_teacher_id
      FROM activities a
      LEFT JOIN teacher_subjects ts ON a.subject_id = ts.subject_id
      WHERE a.id = ? AND (a.teacher_id = ? OR ts.teacher_id = ?)
    `;
    const [activityCheckResult] = await req.db.execute(activityCheckQuery, [
      gradeRecord.activity_id, 
      teacher_id, 
      teacher_id
    ]);

    console.log('Resultado da verificação de atividade:', activityCheckResult);
    console.log('Dados da atividade:', {
      activity_id: gradeRecord.activity_id,
      teacher_id: teacher_id,
      grade_record_teacher_id: gradeRecord.teacher_id
    });

    if (activityCheckResult.length === 0) {
      console.log('Acesso negado - atividade não pertence ao professor:', gradeRecord.teacher_id, teacher_id);
      return res.status(403).json({ error: 'Acesso negado. Atividade não pertence ao professor' });
    }

    // Atualizar a nota - usando apenas colunas que existem na tabela
    const updateQuery = `
      UPDATE activity_grades 
      SET grade = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [updateResult] = await req.db.execute(updateQuery, [
      grade, 
      teacher_id,         // quem está atribuindo a nota (pode ser nulo de acordo com migration 007)
      id
    ]);

    if (updateResult.affectedRows === 0) {
      console.log('Nenhuma linha afetada ao atualizar nota:', id);
      return res.status(404).json({ error: 'Erro ao atualizar nota' });
    }

    // Retornar a nota atualizada
    const selectQuery = `
      SELECT 
        ag.*,
        a.name as activity_name,
        s.name as subject_name,
        p.full_name as student_name_display,
        u.email as student_email
      FROM activity_grades ag
      JOIN enrollments e ON ag.enrollment_id = e.id
      JOIN activities a ON ag.activity_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON e.student_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE ag.id = ?
    `;
    const [updatedResult] = await req.db.execute(selectQuery, [id]);

    console.log('Nota atualizada com sucesso:', updatedResult[0]);

    res.json(updatedResult[0]);
  } catch (error) {
    console.error('Erro ao atualizar nota da atividade:', error);
    console.error('Stack do erro:', error.stack);
    handleError(res, error);
  }
};

export const createActivity = async (req, res) => {
  try {
    console.log('Recebendo requisição para criar atividade:', req.body);
    console.log('User ID autenticado:', req.userId);
    console.log('Arquivo recebido:', req.file);
    
    // Ignorar o campo 'grade' do req.body para evitar conflitos
    const { name, subject_id, type, description, deadline, period, evaluation_type } = req.body;
    const teacher_id = req.userId; // Usar o ID do usuário autenticado

    // Validação dos dados
    if (!name || !subject_id || !type) {
      console.log('Validação falhou:', { name: !!name, subject_id: !!subject_id, type: !!type });
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios: name, subject_id, type'
      });
    }

    // Verifica se o tipo é válido
    if (!['individual', 'team'].includes(type)) {
      console.log('Tipo inválido:', type);
      return res.status(400).json({
        error: 'Tipo inválido. Use "individual" ou "team"'
      });
    }

    // Verifica se o professor existe e é realmente um professor
    console.log('Verificando professor:', teacher_id);
    const teacherQuery = 'SELECT user_id FROM user_roles WHERE user_id = ? AND role = "teacher"';
    const [teacherResult] = await req.db.execute(teacherQuery, [teacher_id]);
    
    if (teacherResult.length === 0) {
      console.log('Professor não encontrado ou não é professor:', teacher_id);
      return res.status(403).json({
        error: 'Acesso negado. Usuário não é um professor ou não está autorizado'
      });
    }

    // Verifica se a disciplina existe e pertence ao professor
    console.log('Verificando disciplina:', subject_id, 'para professor:', teacher_id);
    const subjectQuery = `
      SELECT s.id, s.grade as subject_grade
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE s.id = ? AND ts.teacher_id = ?
    `;
    const [subjectResult] = await req.db.execute(subjectQuery, [subject_id, teacher_id]);
    
    if (subjectResult.length === 0) {
      console.log('Disciplina não encontrada ou não pertence ao professor:', subject_id, teacher_id);
      return res.status(403).json({
        error: 'Disciplina não encontrada ou não pertence ao professor'
      });
    }

    const subject = subjectResult[0];
    const grade = subject.subject_grade; // Obter a série da disciplina, não do formulário

    // Preparar dados do arquivo
    let file_path = null;
    let file_name = null;
    
    if (req.file) {
      file_path = `/uploads/activities/${req.file.filename}`;
      file_name = req.file.originalname;
    }

    // Formatar a data para o formato DATETIME do MySQL, se ela existir
    let formattedDeadline = null;
    if (deadline) {
      // O input datetime-local envia 'YYYY-MM-DDTHH:MM'. Adicionamos os segundos.
      const dateStr = deadline.includes('T') ? deadline + ':00' : deadline;
      try {
        const date = new Date(dateStr);
        // Formata para 'YYYY-MM-DD HH:MM:SS'
        formattedDeadline = date.toISOString().slice(0, 19).replace('T', ' ');
      } catch (e) {
        console.error('Erro ao formatar a data:', deadline, e);
        return res.status(400).json({ error: 'Formato de data inválido.' });
      }
    }

    // Insere a atividade - usar a série da disciplina e os novos campos de período e avaliação
    console.log('Inserindo atividade:', { name, subject_id, grade, type, teacher_id, description, deadline: formattedDeadline, file_path, file_name, period, evaluation_type });
    const insertQuery = `
      INSERT INTO activities (name, subject_id, grade, type, teacher_id, description, deadline, file_path, file_name, period, evaluation_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await req.db.execute(insertQuery, [name, subject_id, grade, type, teacher_id, description || null, formattedDeadline, file_path, file_name, period || null, evaluation_type || null]);
    console.log('Atividade inserida com ID:', result.insertId);

    // Retorna a atividade criada
    const selectQuery = `
      SELECT a.*, p.full_name as teacher_name, s.name as subject_name
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ?
    `;
    const [activityResult] = await req.db.execute(selectQuery, [result.insertId]);
    console.log('Atividade retornada:', activityResult[0]);

    res.status(201).json(activityResult[0]);
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    console.error('Stack do erro:', error.stack);
    handleError(res, error);
  }
};

export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher_id = req.userId; // ID do usuário autenticado

    const query = `
      SELECT a.*, p.full_name as teacher_name, s.name as subject_name
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ? AND a.teacher_id = ?
    `;
    const [result] = await req.db.execute(query, [id, teacher_id]);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Atividade não encontrada ou não pertence ao professor' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    handleError(res, error);
  }
};

export const getActivitiesByTeacher = async (req, res) => {
  try {
    const teacher_id = req.userId; // ID do usuário autenticado
    
    const query = `
      SELECT a.*, p.full_name as teacher_name, s.name as subject_name
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.teacher_id = ?
      ORDER BY a.created_at DESC
    `;
    const [result] = await req.db.execute(query, [teacher_id]);

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar atividades do professor:', error);
    handleError(res, error);
  }
};

export const getActivitiesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.userId; // ID do usuário autenticado

    // Verificar se o usuário é aluno ou professor
    const roleQuery = 'SELECT role FROM user_roles WHERE user_id = ?';
    const [roleResult] = await req.db.execute(roleQuery, [userId]);
    
    if (roleResult.length === 0) {
      return res.status(403).json({ error: 'Acesso negado. Usuário não tem nenhum papel atribuído' });
    }

    const hasTeacherRole = roleResult.some(role => role.role === 'teacher');
    const hasStudentRole = roleResult.some(role => role.role === 'student');

    if (hasTeacherRole) {
      // Professor: verificar se tem acesso à disciplina
      const subjectCheckQuery = `
        SELECT s.id 
        FROM subjects s
        JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE s.id = ? AND ts.teacher_id = ?
      `;
      const [subjectCheckResult] = await req.db.execute(subjectCheckQuery, [subjectId, userId]);
      
      if (subjectCheckResult.length === 0) {
        return res.status(403).json({ error: 'Disciplina não encontrada ou não pertence ao professor' });
      }
    } else if (hasStudentRole) {
      // Aluno: verificar se está matriculado na disciplina
      const enrollmentCheckQuery = `
        SELECT e.id
        FROM enrollments e
        WHERE e.subject_id = ? AND e.student_id = ?
      `;
      const [enrollmentCheckResult] = await req.db.execute(enrollmentCheckQuery, [subjectId, userId]);
      
      if (enrollmentCheckResult.length === 0) {
        return res.status(403).json({ error: 'Acesso negado. Aluno não está matriculado nesta disciplina' });
      }
    } else {
      return res.status(403).json({ error: 'Acesso negado. Usuário não é aluno ou professor' });
    }

    const query = `
      SELECT a.*, p.full_name as teacher_name, s.name as subject_name
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.subject_id = ?
      ORDER BY a.created_at DESC
    `;
    const [result] = await req.db.execute(query, [subjectId]);

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar atividades da disciplina:', error);
    handleError(res, error);
  }
};

export const updateActivity = async (req, res) => {
  try {
    console.log('Recebendo requisição para atualizar atividade:', req.body);
    console.log('Arquivo recebido:', req.file);
    
    const { id } = req.params;
    const { name, subject_id, type, description, deadline, period, evaluation_type } = req.body;
    const teacher_id = req.userId; // ID do usuário autenticado

    // Verifica se a atividade existe e pertence ao professor
    const checkQuery = `
      SELECT a.id, a.subject_id as current_subject_id, a.deadline as current_deadline, a.period as current_period, a.evaluation_type as current_evaluation_type
      FROM activities a
      WHERE a.id = ? AND a.teacher_id = ?
    `;
    const [checkResult] = await req.db.execute(checkQuery, [id, teacher_id]);
    
    if (checkResult.length === 0) {
      return res.status(403).json({ error: 'Atividade não encontrada ou não pertence ao professor' });
    }

    const activity = checkResult[0];
    const final_subject_id = subject_id || activity.current_subject_id; // Usar o subject_id fornecido ou manter o atual

    // Obter a série da disciplina
    const subjectQuery = `
      SELECT s.grade as subject_grade
      FROM subjects s
      WHERE s.id = ?
    `;
    const [subjectResult] = await req.db.execute(subjectQuery, [final_subject_id]);
    
    if (subjectResult.length === 0) {
      return res.status(404).json({ error: 'Disciplina não encontrada' });
    }

    const grade = subjectResult[0].subject_grade; // Obter a série da disciplina

    // Preparar dados do arquivo
    let file_path = null;
    let file_name = null;
    
    if (req.file) {
      file_path = `/uploads/activities/${req.file.filename}`;
      file_name = req.file.originalname;
    }

    // Atualiza atividade - usar a série da disciplina e incluir os novos campos de período e avaliação
    // Atualiza atividade - se houver novo arquivo, atualiza os campos, senão mantém os antigos
    let updateQuery, params;
    if (req.file) {
      updateQuery = `
        UPDATE activities 
        SET name = ?, subject_id = ?, grade = ?, type = ?, description = ?, deadline = ?, file_path = ?, file_name = ?, period = ?, evaluation_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND teacher_id = ?
      `;
      params = [name, final_subject_id, grade, type, description || null, deadline || activity.current_deadline, file_path, file_name, period || activity.current_period, evaluation_type || activity.current_evaluation_type, id, teacher_id];
    } else {
      updateQuery = `
        UPDATE activities 
        SET name = ?, subject_id = ?, grade = ?, type = ?, description = ?, deadline = ?, period = ?, evaluation_type = ?
        WHERE id = ? AND teacher_id = ?
      `;
      params = [name, final_subject_id, grade, type, description || null, deadline || activity.current_deadline, period || activity.current_period, evaluation_type || activity.current_evaluation_type, id, teacher_id];
    }

    await req.db.execute(updateQuery, params);

    // Retorna a atividade atualizada
    const selectQuery = `
      SELECT a.*, p.full_name as teacher_name, s.name as subject_name
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ?
    `;
    const [result] = await req.db.execute(selectQuery, [id]);

    res.json(result[0]);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    handleError(res, error);
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher_id = req.userId; // ID do usuário autenticado

    // Verifica se a atividade existe e pertence ao professor
    const checkQuery = `
      SELECT a.id 
      FROM activities a
      WHERE a.id = ? AND a.teacher_id = ?
    `;
    const [checkResult] = await req.db.execute(checkQuery, [id, teacher_id]);
    
    if (checkResult.length === 0) {
      return res.status(403).json({ error: 'Atividade não encontrada ou não pertence ao professor' });
    }

    // Deleta a atividade (as atividades relacionadas serão deletadas por CASCADE)
    const deleteQuery = 'DELETE FROM activities WHERE id = ? AND teacher_id = ?';
    await req.db.execute(deleteQuery, [id, teacher_id]);

    res.json({ message: 'Atividade deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    handleError(res, error);
  }
};

// Nova função para buscar atividades para alunos (baseado em suas matrículas)
export const getActivitiesByStudent = async (req, res) => {
  try {
    console.log('Recebendo requisição para buscar atividades do aluno');
    console.log('Cookies recebidos:', req.cookies);
    console.log('User ID do middleware:', req.userId);
    
    const student_id = req.userId; // ID do aluno autenticado
    console.log('Buscando atividades para aluno ID:', student_id);

    if (!student_id) {
      console.log('Nenhum student_id encontrado - usuário não autenticado');
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se o usuário é realmente um aluno
    const roleQuery = 'SELECT role FROM user_roles WHERE user_id = ?';
    const [roleResult] = await req.db.execute(roleQuery, [student_id]);
    console.log('Papéis do usuário:', roleResult);
    
    if (roleResult.length === 0) {
      console.log('Nenhum papel encontrado para o usuário:', student_id);
      return res.status(403).json({ error: 'Acesso negado. Usuário não tem nenhum papel atribuído' });
    }

    const hasStudentRole = roleResult.some(role => role.role === 'student');
    console.log('Tem papel de aluno:', hasStudentRole);
    
    if (!hasStudentRole) {
      console.log('Usuário não é aluno. Papéis:', roleResult.map(r => r.role));
      return res.status(403).json({ error: 'Acesso negado. Usuário não é um aluno' });
    }

    // Obter as disciplinas do aluno através da tabela de matrículas
    const enrollmentsQuery = `
      SELECT DISTINCT s.id as subject_id, s.name as subject_name, p.full_name as teacher_name
      FROM enrollments e
      JOIN subjects s ON e.subject_id = s.id
      JOIN users u ON s.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE e.student_id = ?
    `;
    const [enrollmentsResult] = await req.db.execute(enrollmentsQuery, [student_id]);
    console.log('Matrículas do aluno:', enrollmentsResult);

    // Obter as IDs das disciplinas do aluno
    const subjectIds = enrollmentsResult.map(enrollment => enrollment.subject_id);
    console.log('IDs das disciplinas:', subjectIds);

    if (subjectIds.length === 0) {
      console.log('Aluno não está matriculado em nenhuma disciplina');
      return res.json([]); // Retorna array vazio se o aluno não estiver matriculado em nenhuma disciplina
    }

    // Buscar atividades para todas as disciplinas do aluno
    // Incluir também informações sobre submissões e notas para determinar o status
    const activitiesQuery = `
      SELECT 
        a.*,
        p.full_name as teacher_name,
        s.name as subject_name,
        ag.grade as student_grade,
        ag.graded_at as grade_date,
        CASE 
          WHEN ag.grade IS NOT NULL THEN 'completed'
          WHEN ag.grade IS NULL AND ag.student_name IS NOT NULL THEN 'submitted'
          ELSE 'pending'
        END as status
      FROM activities a
      JOIN users u ON a.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN enrollments e ON e.student_id = ? AND e.subject_id = a.subject_id
      LEFT JOIN activity_grades ag ON ag.activity_id = a.id AND ag.enrollment_id = e.id
      WHERE a.subject_id IN (${subjectIds.map(() => '?').join(',')})
      ORDER BY a.created_at DESC
    `;
    const [activitiesResult] = await req.db.execute(activitiesQuery, [student_id, ...subjectIds]);
    console.log('Atividades encontradas:', activitiesResult.length);

    res.json(activitiesResult);
  } catch (error) {
    console.error('Erro ao buscar atividades para aluno:', error);
    handleError(res, error);
  }
};

// Nova função para enviar atividade do aluno
export const submitStudentActivity = async (req, res) => {
  try {
    console.log('Recebendo requisição para envio de atividade do aluno:', req.body);
    console.log('User ID autenticado:', req.userId);
    console.log('Arquivo recebido:', req.file);
    
    const { activity_id, student_name, team_members } = req.body;
    const student_id = req.userId; // Usar o ID do usuário autenticado

    // Validação dos dados
    if (!activity_id || !student_name) {
      console.log('Validação falhou:', { activity_id: !!activity_id, student_name: !!student_name });
      return res.status(400).json({
        error: 'activity_id e student_name são obrigatórios'
      });
    }

    // Verifica se o aluno existe e é realmente um aluno
    console.log('Verificando aluno:', student_id);
    const studentQuery = 'SELECT user_id FROM user_roles WHERE user_id = ? AND role = "student"';
    const [studentResult] = await req.db.execute(studentQuery, [student_id]);
    
    if (studentResult.length === 0) {
      console.log('Aluno não encontrado ou não é aluno:', student_id);
      return res.status(403).json({
        error: 'Acesso negado. Usuário não é um aluno ou não está autorizado'
      });
    }

    // Verifica se a atividade existe
    console.log('Verificando atividade:', activity_id);
    const activityQuery = `
      SELECT a.*, s.name as subject_name
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ?
    `;
    const [activityResult] = await req.db.execute(activityQuery, [activity_id]);
    
    if (activityResult.length === 0) {
      console.log('Atividade não encontrada:', activity_id);
      return res.status(404).json({
        error: 'Atividade não encontrada'
      });
    }

    const activity = activityResult[0];

    // Verifica se o aluno está matriculado na disciplina da atividade
    console.log('Verificando matrícula do aluno na disciplina:', activity.subject_id);
    const enrollmentQuery = `
      SELECT e.id as enrollment_id
      FROM enrollments e
      WHERE e.student_id = ? AND e.subject_id = ?
    `;
    const [enrollmentResult] = await req.db.execute(enrollmentQuery, [student_id, activity.subject_id]);
    
    if (enrollmentResult.length === 0) {
      console.log('Aluno não está matriculado na disciplina:', activity.subject_id);
      return res.status(403).json({
        error: 'Acesso negado. Aluno não está matriculado na disciplina da atividade'
      });
    }

    const enrollment_id = enrollmentResult[0].enrollment_id;

    // Preparar dados do arquivo
    let file_path = null;
    let file_name = null;
    
    if (req.file) {
      file_path = `/uploads/activities/${req.file.filename}`;
      file_name = req.file.originalname;
    }

    // Verifica se já existe uma submissão para esta atividade e aluno
    const existingSubmissionQuery = `
      SELECT id FROM activity_grades
      WHERE activity_id = ? AND enrollment_id = ?
    `;
    const [existingResult] = await req.db.execute(existingSubmissionQuery, [activity_id, enrollment_id]);
    
    if (existingResult.length > 0) {
      console.log('Já existe uma submissão para esta atividade e aluno:', activity_id, student_id);
      return res.status(409).json({
        error: 'Esta atividade já foi enviada anteriormente'
      });
    }

    // Insere a submissão da atividade (usando a tabela activity_grades para armazenar submissões)
    console.log('Inserindo submissão da atividade:', { activity_id, enrollment_id, student_name, team_members, file_path, file_name });
    const insertQuery = `
      INSERT INTO activity_grades (activity_id, enrollment_id, grade, graded_by, student_name, team_members, file_path, file_name)
      VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
    `;
    console.log('Query de inserção:', insertQuery);
    console.log('Parâmetros:', [activity_id, enrollment_id, student_name, team_members || null, file_path, file_name]);
    const [result] = await req.db.execute(insertQuery, [activity_id, enrollment_id, student_name, team_members || null, file_path, file_name]);
    console.log('Submissão inserida com ID:', result.insertId);

    // Retorna a submissão criada
    const selectQuery = `
      SELECT ag.*, a.name as activity_name, s.name as subject_name, p.full_name as student_name_display
      FROM activity_grades ag
      JOIN activities a ON ag.activity_id = a.id
      JOIN enrollments e ON ag.enrollment_id = e.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON e.student_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE ag.id = ?
    `;
    const [submissionResult] = await req.db.execute(selectQuery, [result.insertId]);
    console.log('Submissão retornada:', submissionResult[0]);

    res.status(201).json(submissionResult[0]);
  } catch (error) {
    console.error('Erro ao enviar atividade do aluno:', error);
    console.error('Stack do erro:', error.stack);
    console.error('Mensagem do erro:', error.message);
    console.error('Código do erro:', error.code);
    console.error('Número do erro:', error.errno);
    handleError(res, error);
  }
};

// Nova função para buscar notas de uma atividade específica (apenas alunos que submeteram)
export const getActivityGrades = async (req, res) => {
  try {
    const { id } = req.params; // activity_id
    const teacher_id = req.userId; // ID do professor autenticado

    console.log('Buscando notas para atividade ID:', id, 'do professor:', teacher_id);

    // Verificar se o professor existe usando os papéis já verificados no middleware
    if (!req.userRoles.includes('teacher')) {
      console.log('Professor não encontrado ou não é professor:', teacher_id);
      return res.status(403).json({ error: 'Acesso negado. Usuário não é um professor' });
    }

    // Verificar se a atividade existe e pertence ao professor
    const activityQuery = `
      SELECT a.id, a.name as activity_name, s.id as subject_id, s.name as subject_name
      FROM activities a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ? AND a.teacher_id = ?
    `;
    const [activityResult] = await req.db.execute(activityQuery, [id, teacher_id]);

    if (activityResult.length === 0) {
      console.log('Atividade não encontrada ou não pertence ao professor:', id, teacher_id);
      return res.status(404).json({ error: 'Atividade não encontrada ou não pertence ao professor' });
    }

    const activity = activityResult[0];

    // Buscar todos os alunos matriculados na disciplina da atividade
    // e juntar com as submissões existentes.
    const gradesQuery = `
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        p.full_name as student_name_display,
        u.email as student_email,
        ag.id,
        ag.activity_id,
        ag.grade,
        ag.graded_at,
        ag.graded_by,
        ag.student_name,
        ag.team_members,
        ag.file_path,
        ag.file_name,
        CASE 
          WHEN ag.id IS NOT NULL THEN ag.graded_at
          ELSE NULL
        END as submitted_at,
        CASE 
          WHEN ag.grade IS NOT NULL THEN 'graded'
          WHEN ag.id IS NOT NULL THEN 'submitted'
          ELSE 'pending'
        END as status
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN activity_grades ag ON ag.enrollment_id = e.id AND ag.activity_id = ?
      WHERE e.subject_id = ?
      ORDER BY p.full_name
    `;
    const [gradesResult] = await req.db.execute(gradesQuery, [id, activity.subject_id]);

    const resultsWithNames = gradesResult.map(grade => ({
      ...grade,
      activity_name: activity.activity_name,
      subject_name: activity.subject_name,
    }));

    console.log('Submissões encontradas:', resultsWithNames.length);

    res.json(resultsWithNames);
  } catch (error) {
    console.error('Erro ao buscar notas da atividade:', error);
    handleError(res, error);
  }
};

// Nova função para excluir uma nota específica
export const deleteActivityGrade = async (req, res) => {
  try {
    const { id } = req.params; // grade_id
    const teacher_id = req.userId; // ID do professor autenticado

    console.log('Excluindo nota ID:', id, 'por professor:', teacher_id);

    // Verificar se o professor existe usando os papéis já verificados no middleware
    if (!req.userRoles.includes('teacher')) {
      console.log('Professor não encontrado ou não é professor:', teacher_id);
      return res.status(403).json({ error: 'Acesso negado. Usuário não é um professor' });
    }

    // Verificar se a nota existe e pertence a uma atividade do professor
    const gradeQuery = `
      SELECT ag.id, a.id as activity_id, a.teacher_id
      FROM activity_grades ag
      JOIN enrollments e ON ag.enrollment_id = e.id
      JOIN activities a ON e.subject_id = a.subject_id
      WHERE ag.id = ? AND a.teacher_id = ?
    `;
    const [gradeResult] = await req.db.execute(gradeQuery, [id, teacher_id]);

    if (gradeResult.length === 0) {
      console.log('Nota não encontrada ou não pertence ao professor:', id, teacher_id);
      return res.status(404).json({ error: 'Nota não encontrada ou não pertence ao professor' });
    }

    // Excluir a nota
    const deleteQuery = 'DELETE FROM activity_grades WHERE id = ?';
    await req.db.execute(deleteQuery, [id]);

    res.json({ message: 'Nota excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir nota da atividade:', error);
    handleError(res, error);
  }
};

// Nova função para buscar notas de atividades do aluno
export const getActivityGradesByStudent = async (req, res) => {
  try {
    console.log('Recebendo requisição para buscar notas de atividades do aluno');
    console.log('User ID do middleware:', req.userId);
    console.log('Papéis do usuário:', req.userRoles);
    
    const student_id = req.userId; // ID do aluno autenticado
    console.log('Buscando notas de atividades para aluno ID:', student_id);

    if (!student_id) {
      console.log('Nenhum student_id encontrado - usuário não autenticado');
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se o usuário é realmente um aluno (já verificado no middleware)
    const hasStudentRole = req.userRoles && req.userRoles.includes('student');
    console.log('Tem papel de aluno:', hasStudentRole);
    
    if (!hasStudentRole) {
      console.log('Usuário não é aluno. Papéis:', req.userRoles);
      return res.status(403).json({ error: 'Acesso negado. Usuário não é um aluno' });
    }

    // Obter as disciplinas do aluno através da tabela de matrículas
    const enrollmentsQuery = `
      SELECT e.id as enrollment_id, e.subject_id, s.name as subject_name, p.full_name as teacher_name
      FROM enrollments e
      JOIN subjects s ON e.subject_id = s.id
      JOIN users u ON s.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE e.student_id = ?
    `;
    const [enrollmentsResult] = await req.db.execute(enrollmentsQuery, [student_id]);
    console.log('Matrículas do aluno:', enrollmentsResult);

    // Obter as IDs das matrículas do aluno
    const enrollmentIds = enrollmentsResult.map(enrollment => enrollment.enrollment_id);
    console.log('IDs das matrículas:', enrollmentIds);

    if (enrollmentIds.length === 0) {
      console.log('Aluno não está matriculado em nenhuma disciplina');
      return res.json([]); // Retorna array vazio se o aluno não estiver matriculado em nenhuma disciplina
    }

    // Buscar todas as notas de atividades para as matrículas do aluno
    const gradesQuery = `
      SELECT 
        ag.id as grade_id,
        ag.activity_id,
        ag.grade,
        ag.graded_at,
        ag.graded_by,
        ag.student_name,
        ag.team_members,
        ag.file_path,
        ag.file_name,
        a.name as activity_name,
        s.name as subject_name,
        p.full_name as teacher_name,
        CASE 
          WHEN ag.grade IS NOT NULL THEN 'graded'
          WHEN ag.student_name IS NOT NULL THEN 'submitted'
          ELSE 'pending'
        END as status
      FROM activity_grades ag
      JOIN enrollments e ON ag.enrollment_id = e.id
      JOIN activities a ON ag.activity_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON s.teacher_id = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE ag.enrollment_id IN (${enrollmentIds.map(() => '?').join(',')})
      ORDER BY ag.graded_at DESC, a.created_at DESC
    `;
    const [gradesResult] = await req.db.execute(gradesQuery, enrollmentIds);
    console.log('Notas de atividades encontradas:', gradesResult.length);

    // Mapear os resultados para garantir que todos os campos necessários estejam presentes
    const mappedGrades = gradesResult.map(grade => ({
      grade_id: grade.grade_id || grade.id,
      id: grade.grade_id || grade.id, // Usar o ID da nota como id para compatibilidade
      activity_id: grade.activity_id,
      enrollment_id: grade.enrollment_id,
      student_id: student_id, // Adicionar o ID do aluno
      grade: grade.grade,
      graded_at: grade.graded_at,
      graded_by: grade.graded_by,
      student_name: grade.student_name,
      team_members: grade.team_members,
      file_path: grade.file_path,
      file_name: grade.file_name,
      submitted_at: grade.graded_at, // Usar graded_at como submitted_at
      status: grade.status,
      student_name_display: grade.student_name || '',
      student_email: '', // Não temos email do aluno aqui, mas mantemos para compatibilidade
      subject_name: grade.subject_name,
      activity_name: grade.activity_name,
      teacher_name: grade.teacher_name
    }));

    res.json(mappedGrades);
  } catch (error) {
    console.error('Erro ao buscar notas de atividades do aluno:', error);
    handleError(res, error);
  }
};
