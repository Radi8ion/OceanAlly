import { Request, Response } from 'express';
import Report from '../models/report.model';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { IReport } from '../types';
import { Types } from 'mongoose';
import cloudinary from '../config/cloudinary'; // Import Cloudinary config
import axios from "axios";
// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'ocean_reports' }, // Optional: organize uploads in a folder
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// getFullReport remains the same
const getFullReport = async (id: string | Types.ObjectId) => {
  const report = await Report.findById(id).populate('reporter', 'firstName lastName');
  if (!report) return null;
  const reportObj = report.toObject();
  if (reportObj.reporter) {
    const reporter = reportObj.reporter as any;
    reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
  }
  return reportObj;
};

export const handleCreateReportSocket = async (
  socket: Socket, // The custom type definition now handles the .user property
  data: any,
  io: SocketIOServer
): Promise<void> => {
  try {
    const { hazardType, severity, latitude, longitude, locationDescription, description, isEmergency, reporterName, reporterContact, media } = data;

    const reportData: Partial<IReport> = {
      hazardType,
      severity,
      description,
      locationDescription,
      isEmergency,
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      reporterName,
      reporterContact
    };
    
      if (description && description.trim()) {
        try {
            const analysisResponse = await axios.post('http://localhost:5001/process-text', {
                description: description
            });
            //@ts-ignore
            const { classification, sentiment } = analysisResponse.data;
            reportData.classification = classification;
            reportData.sentiment = sentiment;
            
        } catch (mlError) {
            console.error("Could not process text with ML service:", mlError);
            // Decide if you want to fail or continue without the analysis
        }
    }
    if (media && media.buffer) {
      const uploadResult = await uploadToCloudinary(Buffer.from(media.buffer));
      reportData.mediaUrl = uploadResult.secure_url;
      reportData.mediaPublicId = uploadResult.public_id;
    }
    
    // Use socket.user which is set by the socket middleware
    if (socket.user) {
      // Convert the user ID string to a MongoDB ObjectId
      reportData.reporter = new Types.ObjectId(socket.user._id);
    }

    const newReport = await Report.create(reportData);
    const populatedReport = await getFullReport(newReport._id);

    io.to('officials').emit('new-unverified-report', populatedReport);
    socket.emit('report-creation-success', populatedReport);

  } catch (error: any) {
    console.error("Error creating report:", error);
    socket.emit('report-creation-error', { message: error.message || 'Failed to create report.' });
  }
};

// getVerifiedReports and getUnverifiedReports remain the same
export const getVerifiedReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({ status: 'verified' }).populate('reporter', 'firstName lastName').sort({ createdAt: -1 });
    const formattedReports = reports.map(report => {
        const reportObj = report.toObject();
        if (reportObj.reporter) {
            const reporter = reportObj.reporter as any;
            reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
        }
        return reportObj;
    });
    res.json(formattedReports);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getUnverifiedReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const reports = await Report.find({ status: 'unverified' }).populate('reporter', 'firstName lastName').sort({ createdAt: -1 });
        const formattedReports = reports.map(r => {
            const reportObj = r.toObject();
            if (reportObj.reporter) {
                const reporter = reportObj.reporter as any;
                reportObj.reporterName = `${reporter.firstName} ${reporter.lastName}`;
            }
            return reportObj;
        });
        res.json(formattedReports);
    } catch (error: any) { 
        res.status(500).json({ message: error.message }); 
    }
};

export const verifyReport = async (req: Request, res: Response, io: SocketIOServer): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) { 
      res.status(404).json({ message: 'Report not found' }); 
      return; 
    }
    
    report.status = 'verified';
    
    // Use req.user which should now work with your Express type declaration
    if (req.user) {
      // req.user._id should already be an ObjectId from your IUser interface
      report.verifiedBy = req.user._id;
    }
    
    await report.save();
    const populatedReport = await getFullReport(report._id);
    io.to('public').emit('new-verified-report', populatedReport);
    io.to('officials').emit('report-verified', { reportId: populatedReport?._id });
    res.json(populatedReport);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const rejectReport = async (req: Request, res: Response, io: SocketIOServer): Promise<void> => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) { 
          res.status(404).json({ message: 'Report not found' }); 
          return; 
        }

        // --- CLOUDINARY INTEGRATION ---
        // If the report has an associated media file, delete it from Cloudinary
        if (report.mediaPublicId) {
            await cloudinary.uploader.destroy(report.mediaPublicId);
        }
        // --- END CLOUDINARY INTEGRATION ---

        report.status = 'rejected';
        const updatedReport = await report.save();
        
        io.to('officials').emit('report-rejected', { reportId: updatedReport._id });
        res.json(updatedReport);
    } catch (error: any) { 
        res.status(500).json({ message: error.message }); 
    }
};