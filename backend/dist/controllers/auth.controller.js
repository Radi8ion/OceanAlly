"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getMe = exports.loginUser = exports.registerUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const generateToken = (id) => jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, phone, organization, location } = req.body;
    const role = email.endsWith('@moes.gov.in') ? 'official' : 'citizen';
    try {
        const userExists = await user_model_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const user = await user_model_1.default.create({ firstName, lastName, email, password, phone, organization, location, role });
        res.status(201).json({ _id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, token: generateToken(user._id.toString()) });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await user_model_1.default.findOne({ email });
        console.log(user);
        if (user && (await user.matchPassword(password))) {
            res.json({ _id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, token: generateToken(user._id.toString()) });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.loginUser = loginUser;
const getMe = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.user?.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                organization: user.organization,
                location: user.location,
                role: user.role,
            }
        });
    }
    catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getMe = getMe;
const forgotPassword = async (req, res) => {
    try {
        const user = await user_model_1.default.findOne({ email: req.body.email });
        if (!user) {
            res.status(200).json({ success: true, message: 'Email sent' });
            return;
        }
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
        try {
            await (0, sendEmail_1.default)({
                email: user.email,
                subject: 'Password Reset Token',
                message,
            });
            res.status(200).json({ success: true, message: 'Email sent' });
        }
        catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ message: 'Email could not be sent' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto_1.default
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');
        const user = await user_model_1.default.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired token' });
            return;
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ success: true, token });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.resetPassword = resetPassword;
