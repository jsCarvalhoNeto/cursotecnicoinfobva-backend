import express from 'express';
import { subjectController } from '../controllers/subjectController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Aplicar middleware de transação
router.use(transactionMiddleware);

// Rota para criar uma nova disciplina
router.post('/', subjectController.create);

// Rota para buscar todas as disciplinas
router.get('/', subjectController.getAll);

// Rota para buscar alunos por disciplina
router.get('/:id/students', subjectController.getStudentsBySubject);

// Rota para atualizar uma disciplina
router.put('/:id', subjectController.update);

// Rota para deletar uma disciplina
router.delete('/:id', subjectController.delete);

export default router;
