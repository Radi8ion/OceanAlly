// routes/auth.routes.ts

import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser } from '../controllers/auth.controller';
import { IUser } from '../types'; // Assuming IUser is exported from types
import { getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { forgotPassword } from '../controllers/auth.controller';
import { resetPassword } from '../controllers/auth.controller';
const router = Router();

// --- Local Auth ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/me', authenticate, getMe);
// Helper to generate token
const generateToken = (id: string): string => jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

// --- Google OAuth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = generateToken(user._id.toString());
    // Redirect to a frontend page that handles the token
    res.redirect(`${process.env.CLIENT_URL_GOOGLE}/auth/success?token=${token}`);
  }
);

// --- Facebook OAuth ---
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = generateToken(user._id.toString());
    res.redirect(`${process.env.CLIENT_URL_FACEBOOK}/auth/success?token=${token}`);
  }
);


export default router;