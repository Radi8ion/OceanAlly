import { Request, Response } from 'express';
import User from '../models/user.model';
import Report from '../models/report.model'; // Import the Report model
import { clerkClient } from '@clerk/clerk-sdk-node';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  // This function is called by the frontend right after login.
  try {
    //@ts-ignore
    const { userId } = req.auth; // Provided by Clerk's 'protect' middleware

    if (!userId) {
       res.status(401).json({ message: 'Not authorized' });
       return;
    }

    // Check if user exists in our database
    let user = await User.findOne({ clerkId: userId });

    // If not, create them (this is the "just-in-time" creation)
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || '';
      
      // ✅ This is where you set the role and details
   const role = primaryEmail.endsWith('@admin.gov.in')
  ? 'admin'
  : primaryEmail.endsWith('@moes.gov.in')
    ? 'official'
    : 'citizen';


      user = await User.create({
        clerkId: clerkUser.id,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        email: primaryEmail,
        role: role,
      });
    }

    res.status(200).json({ success: true, user });

  } catch (error: any) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    //@ts-ignore
    const { userId } = req.auth; // Provided by Clerk's 'protect' middleware

    if (!userId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { firstName, lastName, phone, organization, location } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      res.status(400).json({ 
        success: false, 
        message: 'First name and last name are required' 
      });
      return;
    }

    // Find and update user
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        firstName,
        lastName,
        phone: phone || undefined,
        organization: organization || undefined,
        location: location || undefined,
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    res.status(200).json({ 
      success: true, 
      user,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.log(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: error.message 
    });
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    //@ts-ignore
    const { userId } = req.auth; // Provided by Clerk's 'protect' middleware

    if (!userId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Find user in database
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // Get current date and 30 days ago for recent reports
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate user report statistics
    const [totalStats, recentStats, hazardStats, severityStats] = await Promise.all([
      // Total reports by status
      Report.aggregate([
        { $match: { reporter: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent reports (last 30 days)
      Report.countDocuments({
        reporter: user._id,
        createdAt: { $gte: thirtyDaysAgo }
      }),
      
      // Reports by hazard type
      Report.aggregate([
        { $match: { reporter: user._id } },
        {
          $group: {
            _id: '$hazardType',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Reports by severity
      Report.aggregate([
        { $match: { reporter: user._id } },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Emergency reports count
    const emergencyReports = await Report.countDocuments({
      reporter: user._id,
      isEmergency: true
    });

    // Process the aggregation results
    const statusBreakdown = totalStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const hazardTypesBreakdown = hazardStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const severityBreakdown = severityStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate totals
    //@ts-ignore
    const totalReports = Object.values(statusBreakdown).reduce((sum, count) => sum+ count, 0);
    const verifiedReports = statusBreakdown.verified || 0;
    const rejectedReports = statusBreakdown.rejected || 0;
    const unverifiedReports = statusBreakdown.unverified || 0;

    const stats = {
      totalReports,
      verifiedReports,
      rejectedReports,
      unverifiedReports,
      emergencyReports,
      recentReports: recentStats,
      hazardTypesBreakdown,
      severityBreakdown
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


export const getOfficialStats = async (req: Request, res: Response): Promise<void> => {
  try {
    //@ts-ignore
    const { userId } = req.auth; // Provided by Clerk's 'protect' middleware

    if (!userId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Find user in database
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // Check if user is official or admin
    if (user.role !== 'official' && user.role !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only officials and admins can access this endpoint.' 
      });
      return;
    }

    // Get current date and 30 days ago for recent activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Aggregate official review statistics
    const [reviewStats, currentPending, monthlyReviews, responseTimeStats] = await Promise.all([
      // Total reports reviewed by status
      Report.aggregate([
        { 
          $match: { 
            reviewedBy: user._id,
            status: { $in: ['verified', 'rejected'] } // Only count completed reviews
          } 
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Current pending reports (unverified reports in general, not assigned to specific official)
      Report.countDocuments({
        status: 'unverified'
      }),
      
      // Monthly review count (current month)
      Report.countDocuments({
        reviewedBy: user._id,
        status: { $in: ['verified', 'rejected'] },
        updatedAt: { $gte: startOfMonth }
      }),

      // Calculate average response time
      Report.aggregate([
        { 
          $match: { 
            reviewedBy: user._id,
            status: { $in: ['verified', 'rejected'] },
            reviewedAt: { $exists: true }
          } 
        },
        {
          $addFields: {
            responseTimeHours: {
              $divide: [
                { $subtract: ['$reviewedAt', '$createdAt'] },
                1000 * 60 * 60 // Convert milliseconds to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averageResponseTime: { $avg: '$responseTimeHours' }
          }
        }
      ])
    ]);

    // Process the aggregation results
    const statusBreakdown = reviewStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const reportsVerified = statusBreakdown.verified || 0;
    const reportsRejected = statusBreakdown.rejected || 0;
    const reportsReviewed = reportsVerified + reportsRejected;

    // Calculate verification accuracy (percentage of verified vs total reviewed)
    const verificationAccuracy = reportsReviewed > 0 
      ? Math.round((reportsVerified / reportsReviewed) * 100) 
      : 0;

    // Get average response time (default to 0 if no data)
    const averageResponseTime = responseTimeStats.length > 0 
      ? Math.round(responseTimeStats[0].averageResponseTime || 0) 
      : 0;

    // Define common specializations based on hazard types
    // In a real app, this might come from the user profile or be calculated from their review history
    const potentialSpecializations = [
      'Geological Hazards',
      'Weather Events', 
      'Infrastructure',
      'Environmental',
      'Public Safety',
      'Emergency Response'
    ];

    // For now, we'll determine specializations based on the types of reports they've reviewed most
    const specializationQuery = await Report.aggregate([
      { 
        $match: { 
          reviewedBy: user._id,
          status: { $in: ['verified', 'rejected'] }
        } 
      },
      {
        $group: {
          _id: '$hazardType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 } // Top 3 specializations
    ]);

    // Convert hazard types to more readable specialization names
    const hazardTypeToSpecialization: Record<string, string> = {
      'geological': 'Geological Hazards',
      'weather': 'Weather Events',
      'infrastructure': 'Infrastructure',
      'environmental': 'Environmental',
      'other': 'General Safety'
    };

    const specializations = specializationQuery.map(item => 
      hazardTypeToSpecialization[item._id] || 'General Safety'
    );

    // Calculate years of experience (this would typically come from user profile)
    // For now, we'll calculate based on account creation date
    const accountCreationDate = user.createdAt || new Date();
    const yearsOfExperience = Math.max(0, 
      Math.floor((Date.now() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    );

    const officialStats = {
      reportsReviewed,
      reportsVerified,
      reportsRejected,
      averageResponseTime,
      currentPendingReports: currentPending,
      monthlyReviewCount: monthlyReviews,
      verificationAccuracy,
      specializations: specializations.length > 0 ? specializations : ['General Safety'],
      yearsOfExperience: yearsOfExperience > 0 ? yearsOfExperience : undefined
    };

    res.status(200).json({
      success: true,
      stats: officialStats
    });

  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};