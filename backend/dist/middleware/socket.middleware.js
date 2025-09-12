"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
            socket.handshake.query?.token;
        console.log('🔍 Socket token check:', {
            authToken: socket.handshake.auth?.token ? 'Present' : 'Missing',
            headerToken: socket.handshake.headers?.authorization ? 'Present' : 'Missing',
            queryToken: socket.handshake.query?.token ? 'Present' : 'Missing',
            finalToken: token ? 'Found' : 'Not found'
        });
        if (!token) {
            console.log('❌ Socket connection rejected: No token provided');
            return next(new Error('Authentication error: No token provided'));
        }
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error('❌ JWT_SECRET not found in environment variables');
            return next(new Error('Server configuration error'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('🔍 Decoded JWT for socket:', decoded);
        const user = await user_model_1.default.findById(decoded.id).select('-password');
        if (!user) {
            console.log('❌ Socket connection rejected: User not found for ID:', decoded.id);
            return next(new Error('Authentication error: User not found'));
        }
        socket.user = {
            _id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            name: `${user.firstName} ${user.lastName}`
        };
        console.log(`✅ Socket authenticated for user: ${user.email} (${user.role})`);
        next();
    }
    catch (error) {
        console.error('❌ Socket authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new Error('Authentication error: Invalid token'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new Error('Authentication error: Token expired'));
        }
        else {
            return next(new Error('Authentication error: Server error'));
        }
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
