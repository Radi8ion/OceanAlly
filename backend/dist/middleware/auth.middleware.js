"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.attachUser = exports.protect = void 0;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const user_model_1 = __importDefault(require("../models/user.model"));
exports.protect = (0, clerk_sdk_node_1.ClerkExpressRequireAuth)();
const attachUser = async (req, res, next) => {
    if (!req.auth?.userId) {
        res.status(401).json({ message: 'Not authorized, no user ID in request.' });
        return;
    }
    try {
        const user = await user_model_1.default.findOne({ clerkId: req.auth.userId });
        if (!user) {
            res.status(404).json({ message: 'User not found in our system.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Error attaching user:", error);
        res.status(500).json({ message: 'Server error while fetching user data.' });
        return;
    }
};
exports.attachUser = attachUser;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            res.status(401).json({ message: 'Not authorized, user data is missing.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                message: `Forbidden: User with role '${req.user.role}' is not authorized to access this resource.`
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
