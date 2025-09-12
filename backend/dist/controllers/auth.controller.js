"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.loginUser = exports.registerUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
