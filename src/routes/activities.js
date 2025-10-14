import express from 'express';
import {
  createActivity,
  getActivityById,
  getActivitiesByTeacher,
  getActivitiesBySubject,
  getActivitiesByStudent,
  updateActivity,
  deleteActivity,
  submitStudentActivity,
  getActivityGrades,
  deleteActivityGrade,
  updateActivityGrade,
  createActivityGrade,
  getActivityGradesByStudent
} from '../controllers/activityController.js';
import { transactionMiddleware } from '../middleware/database.js';
import { requireAuth, requireTeacher, requireStudent } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Rotas para activities - adicionar middleware de transação onde necessário
router.post('/', requireAuth, requireTeacher, transactionMiddleware, upload.single('file'), createActivity);
// Rotas específicas devem vir antes da rota genérica de ID
router.get('/student', requireAuth, requireStudent, getActivitiesByStudent); // Nova rota para aluno
router.get('/teacher/:teacherId', requireAuth, requireTeacher, getActivitiesByTeacher);
router.get('/subject/:subjectId', requireAuth, getActivitiesBySubject);
router.get('/:id/grades', requireAuth, requireTeacher, getActivityGrades); // Nova rota para notas da atividade
router.get('/:id', requireAuth, getActivityById); // Esta deve vir por último
router.put('/:id', requireAuth, requireTeacher, transactionMiddleware, upload.single('file'), updateActivity);
router.delete('/:id', requireAuth, requireTeacher, transactionMiddleware, deleteActivity);
router.delete('/grades/:id', requireAuth, requireTeacher, transactionMiddleware, deleteActivityGrade); // Nova rota para excluir nota

// Nova rota para envio de atividades do aluno
router.post('/student-activities', requireAuth, requireStudent, transactionMiddleware, upload.single('file'), submitStudentActivity);

// Rota de diagnóstico para verificar a estrutura da tabela activity_grades
router.get('/diagnostic', requireAuth, requireTeacher, async (req, res) => {
  try {
    console.log('Recebendo requisição de diagnóstico');
    
    // Verificar se a tabela activity_grades existe e sua estrutura
    const [tables] = await req.db.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_grades'
    `);
    
    if (tables.length === 0) {
      return res.json({
        error: 'Tabela activity_grades não existe',
        tableExists: false,
        columns: []
      });
    }
    
    // Verificar a estrutura da tabela
    const [columns] = await req.db.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT, 
        COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'activity_grades' 
      AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    // Verificar campos específicos
    const gradeColumn = columns.find(col => col.COLUMN_NAME === 'grade');
    const gradedByColumn = columns.find(col => col.COLUMN_NAME === 'graded_by');
    const studentNameColumn = columns.find(col => col.COLUMN_NAME === 'student_name');
    const teamMembersColumn = columns.find(col => col.COLUMN_NAME === 'team_members');
    const filePathColumn = columns.find(col => col.COLUMN_NAME === 'file_path');
    const fileNameColumn = columns.find(col => col.COLUMN_NAME === 'file_name');
    
    const issues = [];
    if (!gradeColumn || gradeColumn.IS_NULLABLE !== 'YES') {
      issues.push('Campo grade não é nullable');
    }
    if (!gradedByColumn || gradedByColumn.IS_NULLABLE !== 'YES') {
      issues.push('Campo graded_by não é nullable');
    }
    if (!studentNameColumn) {
      issues.push('Campo student_name não existe');
    }
    if (!teamMembersColumn) {
      issues.push('Campo team_members não existe');
    }
    if (!filePathColumn) {
      issues.push('Campo file_path não existe');
    }
    if (!fileNameColumn) {
      issues.push('Campo file_name não existe');
    }
    
    res.json({
      tableExists: true,
      columns: columns,
      issues: issues,
      hasCriticalIssues: issues.length > 0,
      gradeIsNullable: gradeColumn ? gradeColumn.IS_NULLABLE === 'YES' : false,
      gradedByIsNullable: gradedByColumn ? gradedByColumn.IS_NULLABLE === 'YES' : false,
      hasSubmissionFields: !!(studentNameColumn && teamMembersColumn && filePathColumn && fileNameColumn)
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    res.status(500).json({
      error: 'Erro ao executar diagnóstico',
      message: error.message
    });
  }
});

// Rota para atualizar nota de atividade
router.put('/activity-grades/:id', requireAuth, requireTeacher, transactionMiddleware, updateActivityGrade);

// Rota para criar nova nota de atividade
router.post('/activity-grades', requireAuth, requireTeacher, transactionMiddleware, createActivityGrade);

// Rota correta para excluir nota de atividade (corrigindo o caminho)
router.delete('/activity-grades/:id', requireAuth, requireTeacher, transactionMiddleware, deleteActivityGrade);

// Nova rota para buscar notas de atividades do aluno
router.get('/student/grades', requireAuth, requireStudent, getActivityGradesByStudent);

export default router;
