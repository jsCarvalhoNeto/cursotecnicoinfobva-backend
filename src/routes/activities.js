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

// Rota para atualizar nota de atividade
router.put('/activity-grades/:id', requireAuth, requireTeacher, transactionMiddleware, updateActivityGrade);

// Rota para criar nova nota de atividade
router.post('/activity-grades', requireAuth, requireTeacher, transactionMiddleware, createActivityGrade);

// Rota correta para excluir nota de atividade (corrigindo o caminho)
router.delete('/activity-grades/:id', requireAuth, requireTeacher, transactionMiddleware, deleteActivityGrade);

// Nova rota para buscar notas de atividades do aluno
router.get('/student/grades', requireAuth, requireStudent, getActivityGradesByStudent);

export default router;
