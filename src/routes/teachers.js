import express from 'express';
import { create, getAll, update, deleteTeacher, getSubjects, getStudents, getPendingActivities, getCalendarEvents, updatePassword } from '../controllers/teacherController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Rotas de leitura (não precisam de transação)
router.get('/', getAll);
router.get('/:id/subjects', getSubjects);
router.get('/:id/students', getStudents);
router.get('/:id/activities/pending', getPendingActivities);
router.get('/:id/calendar', getCalendarEvents);

// Rotas que precisam de transação para operações de escrita
router.post('/', transactionMiddleware, create);
router.put('/:id', transactionMiddleware, update);
router.put('/:id/password', transactionMiddleware, updatePassword);
router.delete('/:id', transactionMiddleware, deleteTeacher);

export default router;
