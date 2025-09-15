// routes/dashboard.routes.ts
import { Router } from 'express';
import { getStats, getHotspots } from '../controllers/dashboard.controller';
// Only import the middleware you will use
import { protect, attachUser } from '../middleware/auth.middleware';

const router = Router();

// The middleware chain now grants access to any authenticated user
router.get('/stats', protect, attachUser, getStats);
router.get('/hotspots', protect, attachUser, getHotspots);

export default router;