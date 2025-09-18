import express from 'express';
import { getMe, updateMe, getUserStats } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware'; // 👈 Import the middleware

const router = express.Router();

// The 'protect' middleware is placed before the controller function.
// It will run first, ensuring only authenticated users can access these routes.
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/me/stats', protect, getUserStats);

export default router;