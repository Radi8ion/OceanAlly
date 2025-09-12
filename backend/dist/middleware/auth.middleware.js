"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await user_model_1.default.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            req.user = user;
            return next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        return res.status(401).json({ message: 'No token provided' });
    }
};
exports.authenticate = authenticate;
const authenticateSocket = async (token, socket) => {
    if (!token) {
        socket.emit('report-creation-error', { message: 'Authentication error: Token not provided.' });
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_model_1.default.findById(decoded.id);
        if (!user) {
            socket.emit('report-creation-error', { message: 'Authentication error: User not found.' });
            return null;
        }
        socket.user = user;
        return decoded;
    }
    catch (err) {
        socket.emit('report-creation-error', { message: 'Authentication error: Invalid token.' });
        return null;
    }
};
exports.authenticateSocket = authenticateSocket;
