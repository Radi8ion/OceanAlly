import { Request, Response } from 'express';
import Report from '../models/report.model';
import User from '../models/user.model';

export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalReports = await Report.countDocuments();
        const activeHazards = await Report.countDocuments({ status: 'verified' });
        const communityMembers = await User.countDocuments({ role: 'citizen' });
        const responseRate = "98.5%"; 
        res.json({ totalReports, activeHazards, communityMembers, responseRate });
    } catch (error: any) { res.status(500).json({ message: 'Failed to fetch stats', error: error.message }); }
};

export const getHotspots = async (req: Request, res: Response): Promise<void> => {
    try {
        const hotspots = await Report.aggregate([
            { $match: { status: 'verified' } },
            { $group: { _id: "$locationDescription", reports: { $sum: 1 }, risk: { $first: "$severity" } } },
            { $sort: { reports: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, location: "$_id", reports: 1, risk: 1 } }
        ]);
        res.json(hotspots);
    } catch (error: any) { res.status(500).json({ message: 'Failed to fetch hotspots', error: error.message }); }
};