"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectReport = exports.verifyReport = exports.getUnverifiedReports = exports.getVerifiedReports = exports.getReports = exports.handleCreateReportSocket = void 0;
const mongoose_1 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const report_model_1 = __importDefault(require("../models/report.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ resource_type: 'auto', folder: 'ocean_reports' }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
const getFullReport = async (id) => {
    const report = await report_model_1.default.findById(id).populate('reporter', 'firstName lastName');
    if (!report)
        return null;
    const reportObj = report.toObject();
    if (reportObj.reporter) {
        const reporter = reportObj.reporter;
        reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`.trim();
    }
    return reportObj;
};
const handleCreateReportSocket = async (socket, data, io) => {
    try {
        const { hazardType, severity, latitude, longitude, locationDescription, description, isEmergency, media } = data;
        const reportData = {
            hazardType,
            severity,
            description,
            locationDescription,
            isEmergency,
            location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        };
        if (description && description.trim()) {
            try {
                const analysisResponse = await axios_1.default.post('http://localhost:5001/process-text', { description });
                const { classification, sentiment } = analysisResponse.data;
                reportData.classification = classification;
                reportData.sentiment = sentiment;
            }
            catch (mlError) {
                console.error("Could not process text with ML service:", mlError);
            }
        }
        if (media && media.buffer) {
            const uploadResult = await uploadToCloudinary(Buffer.from(media.buffer));
            reportData.mediaUrl = uploadResult.secure_url;
            reportData.mediaPublicId = uploadResult.public_id;
        }
        if (socket.user) {
            reportData.reporter = new mongoose_1.Types.ObjectId(socket.user._id);
        }
        const newReport = await report_model_1.default.create(reportData);
        const populatedReport = await getFullReport(newReport._id);
        io.to('officials').emit('new-unverified-report', populatedReport);
        socket.emit('report-creation-success', populatedReport);
    }
    catch (error) {
        console.error("Error creating report via socket:", error);
        socket.emit('report-creation-error', { message: error.message || 'Failed to create report.' });
    }
};
exports.handleCreateReportSocket = handleCreateReportSocket;
const getReports = async (req, res) => {
    try {
        const { timeRange } = req.query;
        const days = parseInt(timeRange, 10) || 30;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        const reports = await report_model_1.default.find({
            status: 'verified',
            createdAt: { $gte: sinceDate }
        })
            .sort({ createdAt: -1 })
            .lean();
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({
            message: 'Failed to fetch reports',
            error: error.message,
        });
    }
};
exports.getReports = getReports;
const getVerifiedReports = async (req, res) => {
    try {
        const reports = await report_model_1.default.find({ status: 'verified' })
            .populate('reporter', 'firstName lastName')
            .sort({ createdAt: -1 });
        const formattedReports = await Promise.all(reports.map(report => getFullReport(report._id)));
        res.json(formattedReports.filter(Boolean));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getVerifiedReports = getVerifiedReports;
const getUnverifiedReports = async (req, res) => {
    try {
        const reports = await report_model_1.default.find({ status: 'unverified' })
            .populate('reporter', 'firstName lastName')
            .sort({ createdAt: -1 });
        const formattedReports = await Promise.all(reports.map(report => getFullReport(report._id)));
        res.json(formattedReports.filter(Boolean));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUnverifiedReports = getUnverifiedReports;
const verifyReport = async (req, res) => {
    try {
        const io = req.io;
        const report = await report_model_1.default.findById(req.params.id);
        if (!report) {
            res.status(404).json({ message: 'Report not found' });
            return;
        }
        report.status = 'verified';
        if (req.user) {
            report.verifiedBy = req.user._id;
        }
        await report.save();
        const populatedReport = await getFullReport(report._id);
        io.to('public').emit('new-verified-report', populatedReport);
        io.to('officials').emit('report-verified', { reportId: populatedReport?._id });
        res.json(populatedReport);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.verifyReport = verifyReport;
const rejectReport = async (req, res) => {
    try {
        const io = req.io;
        const report = await report_model_1.default.findById(req.params.id);
        if (!report) {
            res.status(404).json({ message: 'Report not found' });
            return;
        }
        if (report.mediaPublicId) {
            try {
                await cloudinary_1.default.uploader.destroy(report.mediaPublicId);
            }
            catch (cloudinaryError) {
                console.error('Error deleting media from Cloudinary:', cloudinaryError);
            }
        }
        report.status = 'rejected';
        await report.save();
        io.to('officials').emit('report-rejected', { reportId: report._id });
        res.status(200).json({ message: 'Report rejected successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.rejectReport = rejectReport;
