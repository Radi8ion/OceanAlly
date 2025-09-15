"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const getMe = async (req, res) => {
    try {
        const { userId } = req.auth;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        let user = await user_model_1.default.findOne({ clerkId: userId });
        if (!user) {
            const clerkUser = await clerk_sdk_node_1.clerkClient.users.getUser(userId);
            const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || '';
            const role = primaryEmail.endsWith('@moes.gov.in') ? 'official' : 'citizen';
            user = await user_model_1.default.create({
                clerkId: clerkUser.id,
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
                email: primaryEmail,
                role: role,
            });
        }
        res.status(200).json({ success: true, user });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getMe = getMe;
