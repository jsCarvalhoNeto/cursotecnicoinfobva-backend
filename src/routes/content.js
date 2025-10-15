import express from 'express';
import { contentController } from '../controllers/contentController.js';
import { transactionMiddleware } from '../middleware/database.js';

const router = express.Router();

// Aplicar middleware de transação
router.use(transactionMiddleware);

// Rota para buscar todo o conteúdo de uma disciplina
router.get('/:id/content', contentController.getAllBySubject);

// Rota para buscar conteúdo de uma disciplina por tipo de seção
router.get('/:id/content/:section', contentController.getBySubjectAndSection);

// Rota para buscar recursos de uma disciplina
router.get('/:id/resources', contentController.getResourcesBySubject);

// Rota para buscar recursos de uma disciplina por tipo de seção
router.get('/:id/resources/:section', contentController.getResourcesBySubjectAndSection);

// Rota para criar/editar conteúdo de uma disciplina
router.post('/:id/content', contentController.createOrUpdateContent);

// Rota para deletar conteúdo de uma disciplina
router.delete('/:id/content/:contentId', contentController.deleteContent);

export default router;
