import express from 'express';
import { getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware'; // 👈 Import the middleware

const router = express.Router();

// The 'protect' middleware is placed before the controller function.
// It will run first, ensuring only authenticated users can access getMe.
router.get('/me', protect, getMe);

export default router;