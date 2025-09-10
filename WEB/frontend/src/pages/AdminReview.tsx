import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Check, X, User, Phone, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api';
// Define the structure of a report object based on your backend model
interface Report {
  _id: string;
  hazardType: string;
  severity: string;
  description: string;
  locationDescription: string;
  reporterName?: string;
  reporterContact?: string;
  createdAt: string;
  mediaUrl?: string; // Added field for media
  isEmergency: boolean; // Added field for emergency status
}

const AdminReview = () => {
  const [unverifiedReports, setUnverifiedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Fetch all unverified reports on component load ---
  const fetchUnverifiedReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/api/v1/reports/unverified', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnverifiedReports(response.data);
    } catch (err) {
      console.error('Failed to fetch unverified reports', err);
      setError('Could not load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnverifiedReports();
  }, []);

  // --- 2. Handler to VERIFY a report ---
  const handleVerify = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      // This calls the PUT /api/v1/reports/verify/:id endpoint
      await apiClient.put(`/api/v1/reports/verify/${reportId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove the verified report from the UI list for immediate feedback
      setUnverifiedReports(prev => prev.filter(report => report._id !== reportId));
    } catch (err) {
      console.error(`Failed to verify report ${reportId}`, err);
      alert('Verification failed. Please try again.');
    }
  };

  // --- 3. Handler to REJECT a report ---
  const handleReject = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      // This calls the PUT /api/v1/reports/reject/:id endpoint
      await apiClient.put(`/api/v1/reports/reject/${reportId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove the rejected report from the UI list
      setUnverifiedReports(prev => prev.filter(report => report._id !== reportId));
    } catch (err) {
      console.error(`Failed to reject report ${reportId}`, err);
      alert('Rejection failed. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to check if a URL points to a video file
  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg)$/i.test(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Review Panel</h1>
          <p className="text-gray-600 mb-8">Review and moderate incoming hazard reports.</p>
        </motion.div>

        {loading && <p>Loading pending reports...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && unverifiedReports.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700">All Clear!</h2>
            <p className="text-gray-500 mt-2">There are no unverified reports in the queue.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unverifiedReports.map((report) => (
            <motion.div key={report._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                {report.mediaUrl && (
                  isVideo(report.mediaUrl) ? (
                    <video src={report.mediaUrl} controls className="rounded-t-lg w-full h-40 object-cover" />
                  ) : (
                    <img src={report.mediaUrl} alt="Hazard media" className="rounded-t-lg w-full h-40 object-cover" />
                  )
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize text-lg">{report.hazardType.replace('-', ' ')}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-2" /> {report.locationDescription}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className={getSeverityColor(report.severity)}>
                      {report.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  {report.isEmergency && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-700 font-medium">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      IMMEDIATE RESPONSE REQUIRED
                    </div>
                  )}
                  <p className="text-gray-700 mb-4 flex-grow">{report.description}</p>
                  <div className="text-sm text-gray-500 space-y-2 border-t pt-4">
                     {report.reporterName && (
                        <div className="flex items-center"><User className="w-4 h-4 mr-2" />{report.reporterName}</div>
                     )}
                     {report.reporterContact && (
                        <div className="flex items-center"><Phone className="w-4 h-4 mr-2" />{report.reporterContact}</div>
                     )}
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" /> {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {/* --- Action Buttons --- */}
                  <div className="flex justify-end space-x-3 mt-4">
                    <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => handleReject(report._id)}>
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerify(report._id)}>
                      <Check className="w-4 h-4 mr-2" /> Verify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReview;

