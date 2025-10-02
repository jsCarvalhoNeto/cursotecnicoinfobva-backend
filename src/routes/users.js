import express from 'express';
import { userController } from '../controllers/userController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Aplicar middleware de transação
router.use(transactionMiddleware);

// Rota para atualizar o papel de um usuário
router.put('/:id/role', userController.updateRole);

// Rota para buscar todos os usuários (com seus papéis)
router.get('/', userController.getAll);

export default router;
