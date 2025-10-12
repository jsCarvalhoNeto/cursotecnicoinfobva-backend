import { Router } from 'express';
import { resourceController } from '../controllers/resourceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Rotas para recursos de disciplinas
router.get('/:id/resources/:section', requireAuth, resourceController.getResourcesBySection);
router.post('/:id/resources', requireAuth, resourceController.createResource);
router.put('/:id/resources/:resourceId', requireAuth, resourceController.updateResource);
router.delete('/:id/resources/:resourceId', requireAuth, resourceController.deleteResource);

export default router;
