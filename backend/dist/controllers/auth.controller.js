"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.updateMe = exports.getMe = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const report_model_1 = __importDefault(require("../models/report.model"));
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
const updateMe = async (req, res) => {
    try {
        const { userId } = req.auth;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        const { firstName, lastName, phone, organization, location } = req.body;
        if (!firstName || !lastName) {
            res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
            return;
        }
        const user = await user_model_1.default.findOneAndUpdate({ clerkId: userId }, {
            firstName,
            lastName,
            phone: phone || undefined,
            organization: organization || undefined,
            location: location || undefined,
        }, {
            new: true,
            runValidators: true
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
exports.updateMe = updateMe;
const getUserStats = async (req, res) => {
    try {
        const { userId } = req.auth;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        const user = await user_model_1.default.findOne({ clerkId: userId });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [totalStats, recentStats, hazardStats, severityStats] = await Promise.all([
            report_model_1.default.aggregate([
                { $match: { reporter: user._id } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            report_model_1.default.countDocuments({
                reporter: user._id,
                createdAt: { $gte: thirtyDaysAgo }
            }),
            report_model_1.default.aggregate([
                { $match: { reporter: user._id } },
                {
                    $group: {
                        _id: '$hazardType',
                        count: { $sum: 1 }
                    }
                }
            ]),
            report_model_1.default.aggregate([
                { $match: { reporter: user._id } },
                {
                    $group: {
                        _id: '$severity',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        const emergencyReports = await report_model_1.default.countDocuments({
            reporter: user._id,
            isEmergency: true
        });
        const statusBreakdown = totalStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const hazardTypesBreakdown = hazardStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const severityBreakdown = severityStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const totalReports = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
        const verifiedReports = statusBreakdown.verified || 0;
        const rejectedReports = statusBreakdown.rejected || 0;
        const unverifiedReports = statusBreakdown.unverified || 0;
        const stats = {
            totalReports,
            verifiedReports,
            rejectedReports,
            unverifiedReports,
            emergencyReports,
            recentReports: recentStats,
            hazardTypesBreakdown,
            severityBreakdown
        };
        res.status(200).json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
exports.getUserStats = getUserStats;
