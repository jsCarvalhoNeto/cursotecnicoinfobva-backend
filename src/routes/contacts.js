import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

// Rota para envio de mensagens de contato
router.post('/contact', sendContactEmail);

export default router;
