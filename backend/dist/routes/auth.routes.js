"use strict";
// routes/auth.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// --- Local Auth ---
router.post('/register', auth_controller_1.registerUser);
router.post('/login', auth_controller_1.loginUser);
// Helper to generate token
const generateToken = (id) => jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// --- Google OAuth ---
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
    const user = req.user;
    const token = generateToken(user._id.toString());
    // Redirect to a frontend page that handles the token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
});
// --- Facebook OAuth ---
router.get('/facebook', passport_1.default.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { failureRedirect: '/login', session: false }), (req, res) => {
    const user = req.user;
    const token = generateToken(user._id.toString());
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
});
exports.default = router;
