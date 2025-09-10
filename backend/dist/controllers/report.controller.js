"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectReport = exports.verifyReport = exports.getUnverifiedReports = exports.getVerifiedReports = exports.createReport = void 0;
const report_model_1 = __importDefault(require("../models/report.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary")); // Import Cloudinary config
// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ resource_type: 'auto', folder: 'ocean_reports' }, // Optional: organize uploads in a folder
        (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
// getFullReport remains the same
const getFullReport = async (id) => {
    const report = await report_model_1.default.findById(id).populate('reporter', 'firstName lastName');
    if (!report)
        return null;
    const reportObj = report.toObject();
    if (reportObj.reporter) {
        const reporter = reportObj.reporter;
        reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
    }
    return reportObj;
};
const createReport = async (req, res, io) => {
    const { hazardType, severity, latitude, longitude, locationDescription, description, isEmergency, reporterName, reporterContact } = req.body;
    try {
        const reportData = {
            hazardType, severity, description, locationDescription, isEmergency: isEmergency === 'true',
            location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            reporterName, reporterContact
        };
        // --- CLOUDINARY INTEGRATION ---
        // If a file is uploaded, send it to Cloudinary
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            reportData.mediaUrl = uploadResult.secure_url;
            reportData.mediaPublicId = uploadResult.public_id;
        }
        // --- END CLOUDINARY INTEGRATION ---
        if (req.user)
            reportData.reporter = req.user._id;
        const newReport = await report_model_1.default.create(reportData);
        const populatedReport = await getFullReport(newReport._id);
        io.to('officials').emit('new-unverified-report', populatedReport);
        res.status(201).json(populatedReport);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createReport = createReport;
// getVerifiedReports and getUnverifiedReports remain the same
const getVerifiedReports = async (req, res) => {
    try {
        const reports = await report_model_1.default.find({ status: 'verified' }).populate('reporter', 'firstName lastName').sort({ createdAt: -1 });
        const formattedReports = reports.map(report => {
            const reportObj = report.toObject();
            if (reportObj.reporter) {
                const reporter = reportObj.reporter;
                reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
            }
            return reportObj;
        });
        res.json(formattedReports);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getVerifiedReports = getVerifiedReports;
const getUnverifiedReports = async (req, res) => {
    try {
        const reports = await report_model_1.default.find({ status: 'unverified' }).populate('reporter', 'firstName lastName').sort({ createdAt: -1 });
        const formattedReports = reports.map(r => {
            const reportObj = r.toObject();
            if (reportObj.reporter) {
                const reporter = reportObj.reporter;
                reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
            }
            return reportObj;
        });
        res.json(formattedReports);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUnverifiedReports = getUnverifiedReports;
// verifyReport remains the same
const verifyReport = async (req, res, io) => {
    try {
        const report = await report_model_1.default.findById(req.params.id);
        if (!report) {
            res.status(404).json({ message: 'Report not found' });
            return;
        }
        report.status = 'verified';
        if (req.user)
            report.verifiedBy = req.user._id;
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
const rejectReport = async (req, res, io) => {
    try {
        const report = await report_model_1.default.findById(req.params.id);
        if (!report) {
            res.status(404).json({ message: 'Report not found' });
            return;
        }
        // --- CLOUDINARY INTEGRATION ---
        // If the report has an associated media file, delete it from Cloudinary
        if (report.mediaPublicId) {
            await cloudinary_1.default.uploader.destroy(report.mediaPublicId);
        }
        // --- END CLOUDINARY INTEGRATION ---
        report.status = 'rejected';
        const updatedReport = await report.save();
        io.to('officials').emit('report-rejected', { reportId: updatedReport._id });
        res.json(updatedReport);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.rejectReport = rejectReport;
