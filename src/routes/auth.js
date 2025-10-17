import express from 'express';
import { authController } from '../controllers/authController.js';
import { transactionMiddleware } from '../middleware/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Rota para obter informações do usuário atual (baseado na sessão) - não precisa de transação
router.get('/auth/me', requireAuth, authController.getMe);

// Rotas que precisam de transação para operações de escrita
router.post('/auth/register', transactionMiddleware, authController.register);
router.post('/auth/login', transactionMiddleware, authController.login);
router.post('/auth/logout', transactionMiddleware, authController.logout);

export default router;
