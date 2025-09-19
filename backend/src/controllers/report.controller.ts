import { Request, Response } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Types } from 'mongoose';
import axios from 'axios';

import Report from '../models/report.model';
import cloudinary from '../config/cloudinary';
import { IReport, IUser } from '../types';

/**
 * Custom Request type that extends Express's Request.
 * This gives us type safety for the properties we add in our middleware.
 */
interface AuthenticatedRequest extends Request {
  user?: IUser;
  io?: SocketIOServer;
}

// Helper to upload a file buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'ocean_reports' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper to get a single report and populate its reporter details
const getFullReport = async (id: string | Types.ObjectId) => {
  const report = await Report.findById(id).populate('reporter', 'firstName lastName');
  if (!report) return null;

  const reportObj = report.toObject();
  if (reportObj.reporter) {
    const reporter = reportObj.reporter as any;
    reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`.trim();
  }
  return reportObj;
};

// --- SOCKET.IO EVENT HANDLER ---
export const handleCreateReportSocket = async (socket: Socket, data: any, io: SocketIOServer): Promise<void> => {
  try {
    const { hazardType, severity, latitude, longitude, locationDescription, description, isEmergency, media } = data;

    const reportData: Partial<IReport> = {
      hazardType,
      severity,
      description,
      locationDescription,
      isEmergency,
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
    };

    // Process text with ML service if description exists
    if (description && description.trim()) {
      try {
        const analysisResponse = await axios.post('http://localhost:5001/process-text', { description });
        //@ts-ignore
        const { classification, sentiment } = analysisResponse.data;
        reportData.classification = classification;
        reportData.sentiment = sentiment;
      } catch (mlError) {
        console.error("Could not process text with ML service:", mlError);
      }
    }

    // Upload media if provided
    if (media && media.buffer) {
      const uploadResult = await uploadToCloudinary(Buffer.from(media.buffer));
      reportData.mediaUrl = uploadResult.secure_url;
      reportData.mediaPublicId = uploadResult.public_id;
    }
    
    // Attach reporter from socket user
    if (socket.user) {
      reportData.reporter = new Types.ObjectId(socket.user._id);
    }

    const newReport = await Report.create(reportData);
    const populatedReport = await getFullReport(newReport._id);

    // Emit to officials and confirm to user
    io.to('officials').emit('new-unverified-report', populatedReport);
    socket.emit('report-creation-success', populatedReport);

  } catch (error: any) {
    console.error("Error creating report via socket:", error);
    socket.emit('report-creation-error', { message: error.message || 'Failed to create report.' });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeRange } = req.query; // e.g. ?timeRange=30
    const days = parseInt(timeRange as string, 10) || 30;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const reports = await Report.find({
      status: 'verified',
      createdAt: { $gte: sinceDate }
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
};

// --- EXPRESS ROUTE CONTROLLERS ---
export const getVerifiedReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({ status: 'verified' })
      .populate('reporter', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    const formattedReports = await Promise.all(
      reports.map(report => getFullReport(report._id))
    );
    
    res.json(formattedReports.filter(Boolean)); // Filter out null results
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getUnverifiedReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({ status: 'unverified' })
      .populate('reporter', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    const formattedReports = await Promise.all(
      reports.map(report => getFullReport(report._id))
    );
    
    res.json(formattedReports.filter(Boolean)); // Filter out null results
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const verifyReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const io = req.io!;
    const report = await Report.findById(req.params.id);

    if (!report) { 
      res.status(404).json({ message: 'Report not found' }); 
      return; 
    }
    
    report.status = 'verified';
    
    // ✅ This ensures type safety and handles edge cases
 
    if (req.user) {
      report.verifiedBy = req.user._id as Types.ObjectId;
    }
    
    await report.save();
    const populatedReport = await getFullReport(report._id);

    // Notify public and officials
    io.to('public').emit('new-verified-report', populatedReport);
    io.to('officials').emit('report-verified', { reportId: populatedReport?._id });

    res.json(populatedReport);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const rejectReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const io = req.io!;
    const report = await Report.findById(req.params.id);

    if (!report) { 
      res.status(404).json({ message: 'Report not found' }); 
      return; 
    }

    // Clean up media from Cloudinary if it exists
    if (report.mediaPublicId) {
      try {
        await cloudinary.uploader.destroy(report.mediaPublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting media from Cloudinary:', cloudinaryError);
      }
    }

    // Mark as rejected instead of deleting
    report.status = 'rejected'; 
    await report.save();
    
    // Notify officials
    io.to('officials').emit('report-rejected', { reportId: report._id });
    res.status(200).json({ message: 'Report rejected successfully.' });
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};