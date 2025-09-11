// routes/dashboard.routes.ts
import { Router } from 'express';
import { getStats, getHotspots } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware'; // Example middleware

const router = Router();

router.get('/stats', authenticate, getStats);
router.get('/hotspots', authenticate, getHotspots);

export default router;
