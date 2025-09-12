import { Request, Response } from 'express';
import Report from '../models/report.model';
import User from '../models/user.model';
import axios from 'axios';
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
    // 1. Fetch relevant reports from MongoDB
    const reports = await Report.find({ status: 'verified' })
      .select('location locationDescription severity')
      .lean();

    if (reports.length < 3) {
      // CORRECTED: Removed the 'return' keyword
      res.json([]); 
      return; // Use a bare return to exit the function
    }
    
    // 2. Prepare data for the Python service
    const reportsForClustering = reports.map(r => ({
        _id: r._id,
        latitude: r.location.coordinates[1],
        longitude: r.location.coordinates[0]
    }));
    
    // 3. Call the Python clustering service
    const hotspotsResponse = await axios.post('http://localhost:5001/find-hotspots', {
        reports: reportsForClustering
    });
    
    // 4. Return the hotspots found by the Python service
    // CORRECTED: The last line doesn't need 'return' either, but it works implicitly.
    // Being explicit is fine.
    //@ts-ignore
    res.json(hotspotsResponse.data.hotspots);

  } catch (error: any) {
    // CORRECTED: This also applies to error responses
    res.status(500).json({ message: 'Failed to fetch hotspots', error: error.message });
  }
};