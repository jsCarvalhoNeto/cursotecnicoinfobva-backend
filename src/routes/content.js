import { Router } from 'express';
import { contentController } from '../controllers/contentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Rotas para conteúdo de disciplinas
router.get('/:id/content/:section', requireAuth, contentController.getContentBySection);
router.get('/:id/content', requireAuth, contentController.getAllContent);
router.post('/:id/content', requireAuth, contentController.createContent);
router.put('/:id/content/:contentId', requireAuth, contentController.updateContent);
router.delete('/:id/content/:contentId', requireAuth, contentController.deleteContent);

export default router;
