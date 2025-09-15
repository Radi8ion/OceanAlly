"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    organization: { type: String },
    location: { type: String },
    role: { type: String, enum: ['citizen', 'official', 'admin'], default: 'citizen' },
}, {
    timestamps: true
});
exports.User = (0, mongoose_1.model)('User', userSchema);
exports.default = exports.User;
