import express from 'express';
import { subjectController } from '../controllers/subjectController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Rota para buscar todas as disciplinas (não precisa de transação)
router.get('/', subjectController.getAll);

// Rota para buscar uma disciplina específica por ID (não precisa de transação)
router.get('/:id', subjectController.getById);

// Rota para buscar alunos por disciplina (não precisa de transação)
router.get('/:id/students', subjectController.getStudentsBySubject);

// Rotas que precisam de transação para operações de escrita
router.post('/', transactionMiddleware, subjectController.create);
router.put('/:id', transactionMiddleware, subjectController.update);
router.delete('/:id', transactionMiddleware, subjectController.delete);

export default router;
