"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHotspots = exports.getStats = void 0;
const report_model_1 = __importDefault(require("../models/report.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getStats = async (req, res) => {
    try {
        const totalReports = await report_model_1.default.countDocuments();
        const activeHazards = await report_model_1.default.countDocuments({ status: 'verified' });
        const communityMembers = await user_model_1.default.countDocuments({ role: 'citizen' });
        const responseRate = "98.5%";
        res.json({ totalReports, activeHazards, communityMembers, responseRate });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
};
exports.getStats = getStats;
const getHotspots = async (req, res) => {
    try {
        const hotspots = await report_model_1.default.aggregate([
            { $match: { status: 'verified' } },
            { $group: { _id: "$locationDescription", reports: { $sum: 1 }, risk: { $first: "$severity" } } },
            { $sort: { reports: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, location: "$_id", reports: 1, risk: 1 } }
        ]);
        res.json(hotspots);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch hotspots', error: error.message });
    }
};
exports.getHotspots = getHotspots;
