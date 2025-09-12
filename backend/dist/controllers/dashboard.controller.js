"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHotspots = exports.getStats = void 0;
const report_model_1 = __importDefault(require("../models/report.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const axios_1 = __importDefault(require("axios"));
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
        const reports = await report_model_1.default.find({ status: 'verified' })
            .select('location locationDescription severity')
            .lean();
        if (reports.length < 3) {
            res.json([]);
            return;
        }
        const reportsForClustering = reports.map(r => ({
            _id: r._id,
            latitude: r.location.coordinates[1],
            longitude: r.location.coordinates[0]
        }));
        const hotspotsResponse = await axios_1.default.post('http://localhost:5001/find-hotspots', {
            reports: reportsForClustering
        });
        res.json(hotspotsResponse.data.hotspots);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch hotspots', error: error.message });
    }
};
exports.getHotspots = getHotspots;
