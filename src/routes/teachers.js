import express from 'express';
import { create, getAll, update, deleteTeacher, getSubjects, getStudents, getPendingActivities, getCalendarEvents, updatePassword } from '../controllers/teacherController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Aplicar middleware de transação
router.use(transactionMiddleware);

// Rota para criar um novo professor
router.post('/', create);

// Rota para buscar todos os professores
router.get('/', getAll);

// Rota para atualizar um professor existente
router.put('/:id', update);

// Rota para deletar um professor
router.delete('/:id', deleteTeacher);

// Rota para buscar disciplinas do professor
router.get('/:id/subjects', getSubjects);

// Rota para buscar alunos de um professor
router.get('/:id/students', getStudents);

// Rota para buscar atividades pendentes
router.get('/:id/activities/pending', getPendingActivities);

// Rota para buscar eventos do calendário do professor
router.get('/:id/calendar', getCalendarEvents);

// Rota para atualizar a senha de um professor
router.put('/:id/password', updatePassword);

export default router;
