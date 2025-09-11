// src/services/report.service.ts
import Report from '../models/report.model';
import { IReport } from '../types';
import { Types } from 'mongoose';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.util';

// A more specific type for populated reporter to avoid 'any'
type PopulatedReporter = {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
};

/**
 * Formats a report object by adding a concatenated reporterName.
 */
const formatReport = (report: IReport) => {
    const reportObj = report.toObject();
    if (reportObj.reporter) {
        const reporter = reportObj.reporter as PopulatedReporter;
        reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
    }
    return reportObj;
};

export const ReportService = {
    /**
     * Creates a new report, uploads media if present, and saves to the database.
     */
    async create(reportData: Partial<IReport>, fileBuffer?: Buffer): Promise<IReport> {
        const dataToSave: Partial<IReport> = { ...reportData };

        if (fileBuffer) {
            const uploadResult = await uploadToCloudinary(fileBuffer);
            dataToSave.mediaUrl = uploadResult.secure_url;
            dataToSave.mediaPublicId = uploadResult.public_id;
        }

        const newReport = await Report.create(dataToSave);
        return this.findById(newReport._id);
    },

    /**
     * Finds a single report by its ID and populates the reporter's name.
     */
    async findById(id: string | Types.ObjectId): Promise<IReport> {
        const report = await Report.findById(id).populate('reporter', 'firstName lastName');
        if (!report) {
            throw new Error('Report not found');
        }
        return formatReport(report);
    },

    /**
     * Finds all reports matching a specific status.
     */
    async findAllByStatus(status: 'verified' | 'unverified'): Promise<IReport[]> {
        const reports = await Report.find({ status })
            .populate('reporter', 'firstName lastName')
            .sort({ createdAt: -1 });
        return reports.map(formatReport);
    },

    /**
     * Verifies a report by its ID.
     */
    async verify(id: string, verifiedById: Types.ObjectId): Promise<IReport> {
        const report = await Report.findById(id);
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
    async reject(id: string): Promise<IReport> {
        const report = await Report.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }

        // Delete associated media from Cloudinary if it exists
        if (report.mediaPublicId) {
            await deleteFromCloudinary(report.mediaPublicId);
        }
        
        // Using findByIdAndDelete is more atomic for this operation
        const deletedReport = await Report.findByIdAndDelete(id);
        if (!deletedReport) {
            throw new Error('Report not found during deletion.'); // Should not happen if first check passes
        }
        
        // We return the deleted document's data.
        // It's already gone from the DB, so we can't re-populate it.
        return deletedReport;
    },
};