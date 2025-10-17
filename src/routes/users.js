import express from 'express';
import { userController } from '../controllers/userController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Rota para buscar todos os usuários (com seus papéis) - não precisa de transação
router.get('/', userController.getAll);

// Rota que precisa de transação para operação de escrita
router.put('/:id/role', transactionMiddleware, userController.updateRole);

export default router;
