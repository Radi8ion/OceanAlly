"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
// src/services/report.service.ts
const report_model_1 = __importDefault(require("../models/report.model"));
const cloudinary_util_1 = require("../utils/cloudinary.util");
/**
 * Formats a report object by adding a concatenated reporterName.
 */
const formatReport = (report) => {
    const reportObj = report.toObject();
    if (reportObj.reporter) {
        const reporter = reportObj.reporter;
        reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
    }
    return reportObj;
};
exports.ReportService = {
    /**
     * Creates a new report, uploads media if present, and saves to the database.
     */
    async create(reportData, fileBuffer) {
        const dataToSave = { ...reportData };
        if (fileBuffer) {
            const uploadResult = await (0, cloudinary_util_1.uploadToCloudinary)(fileBuffer);
            dataToSave.mediaUrl = uploadResult.secure_url;
            dataToSave.mediaPublicId = uploadResult.public_id;
        }
        const newReport = await report_model_1.default.create(dataToSave);
        return this.findById(newReport._id);
    },
    /**
     * Finds a single report by its ID and populates the reporter's name.
     */
    async findById(id) {
        const report = await report_model_1.default.findById(id).populate('reporter', 'firstName lastName');
        if (!report) {
            throw new Error('Report not found');
        }
        return formatReport(report);
    },
    /**
     * Finds all reports matching a specific status.
     */
    async findAllByStatus(status) {
        const reports = await report_model_1.default.find({ status })
            .populate('reporter', 'firstName lastName')
            .sort({ createdAt: -1 });
        return reports.map(formatReport);
    },
    /**
     * Verifies a report by its ID.
     */
    async verify(id, verifiedById) {
        const report = await report_model_1.default.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }
        report.status = 'verified';
        report.verifiedBy = verifiedById;
        await report.save();
        return this.findById(id);
    },
    /**
     * Rejects a report by its ID, deleting associated media.
     */
    async reject(id) {
        const report = await report_model_1.default.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }
        // Delete associated media from Cloudinary if it exists
        if (report.mediaPublicId) {
            await (0, cloudinary_util_1.deleteFromCloudinary)(report.mediaPublicId);
        }
        // Using findByIdAndDelete is more atomic for this operation
        const deletedReport = await report_model_1.default.findByIdAndDelete(id);
        if (!deletedReport) {
            throw new Error('Report not found during deletion.'); // Should not happen if first check passes
        }
        // We return the deleted document's data.
        // It's already gone from the DB, so we can't re-populate it.
        return deletedReport;
    },
};
