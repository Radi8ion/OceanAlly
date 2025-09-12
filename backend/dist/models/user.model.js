"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    organization: { type: String },
    location: { type: String },
    password: { type: String, select: false },
    role: { type: String, enum: ['citizen', 'official', 'admin'], default: 'citizen' },
    googleId: { type: String },
    facebookId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
}, { timestamps: true });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password)
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
userSchema.methods.matchPassword = async function (enteredPassword) {
    const user = await exports.User.findById(this._id).select('+password');
    if (!user || !user.password)
        return false;
    return await bcryptjs_1.default.compare(enteredPassword, user.password);
};
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto_1.default.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};
exports.User = (0, mongoose_1.model)('User', userSchema);
exports.default = exports.User;
