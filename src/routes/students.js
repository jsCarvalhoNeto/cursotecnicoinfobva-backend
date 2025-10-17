import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Rotas de leitura (não precisam de transação)
router.get('/', studentController.getAll);
router.get('/:id', studentController.getById);
router.get('/:id/subjects', studentController.getSubjects);
router.get('/grade/:grade', studentController.getByGrade);

// Rotas que precisam de transação para operações de escrita
router.post('/', transactionMiddleware, studentController.create);
router.put('/:id', transactionMiddleware, studentController.update);
router.put('/:id/password', transactionMiddleware, studentController.updatePassword);
router.delete('/:id', transactionMiddleware, studentController.delete);

export default router;
