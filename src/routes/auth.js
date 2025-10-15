import express from 'express';
import { authController } from '../controllers/authController.js';
import { transactionMiddleware } from '../middleware/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de transação
router.use(transactionMiddleware);

// Rota para cadastro de novo usuário
router.post('/auth/register', authController.register);

// Rota para login de usuário
router.post('/auth/login', authController.login);

// Rota para obter informações do usuário atual (baseado na sessão)
router.get('/auth/me', requireAuth, authController.getMe);

// Rota para logout
router.post('/auth/logout', authController.logout);

export default router;
