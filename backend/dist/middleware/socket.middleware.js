"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const user_model_1 = __importDefault(require("../models/user.model"));
const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            console.log('❌ Socket connection rejected: No token provided');
            return next(new Error('Authentication error: No token provided'));
        }
        const claims = await clerk_sdk_node_1.clerkClient.verifyToken(token);
        if (!claims || !claims.sub) {
            return next(new Error('Authentication error: Invalid token'));
        }
        const user = await user_model_1.default.findOne({ clerkId: claims.sub });
        if (!user) {
            console.log('❌ Socket connection rejected: User not found for Clerk ID:', claims.sub);
            return next(new Error('Authentication error: User not found in our system'));
        }
        socket.user = user;
        console.log(`✅ Socket authenticated for user: ${user.email} (Role: ${user.role})`);
        next();
    }
    catch (error) {
        console.error('❌ Socket authentication error:', error.message);
        return next(new Error('Authentication error: Invalid token'));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
