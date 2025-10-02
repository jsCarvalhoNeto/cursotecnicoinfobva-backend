import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Aplicar middleware de transação
router.use(transactionMiddleware);

// Rota para criar um novo estudante
router.post('/', studentController.create);

// Rota para buscar todos os estudantes
router.get('/', studentController.getAll);

// Rota para buscar um estudante específico
router.get('/:id', studentController.getById);

// Rota para atualizar um estudante existente
router.put('/:id', studentController.update);

// Rota para atualizar a senha de um estudante
router.put('/:id/password', studentController.updatePassword);

// Rota para deletar um estudante
router.delete('/:id', studentController.delete);

// Rota para buscar disciplinas do estudante
router.get('/:id/subjects', studentController.getSubjects);

// Rota para buscar alunos filtrados por série
router.get('/grade/:grade', studentController.getByGrade);

export default router;
