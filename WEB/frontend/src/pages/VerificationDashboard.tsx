import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
  CalendarDays,
  Eye,
  Loader2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import apiClient from '../lib/api'; // Adjust the path if needed
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
// --- INTERFACES ---
interface Report {
  _id: string;
  reporterName?: string;
  hazardType: 'tsunami' | 'cyclone' | 'pollution' | 'algae' | 'debris' | 'lightning' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    coordinates: [number, number];
  };
  locationDescription: string;
  description: string;
  mediaUrl?: string;
  status: 'unverified' | 'verified' | 'rejected';
  createdAt: string;
  classification?: {
    label: string;
    confidence: number;
    labels_map?: { [key: string]: string };
  };
  sentiment?: {
    score: number;
    urgency_level: 'low' | 'medium' | 'high';
  };
  imageAnalysis?: {
    caption: string;
    classification: {
      label: string;
      confidence: number;
      labels_map: { [key: string]: string };
    };
    sentiment: {
      score: number;
      urgency_level: 'low' | 'medium' | 'high';
    };
  };
}

interface ImageAnalysisResult {
  status: string;
  caption: string;
  classification: {
    label: string;
    confidence: number;
    labels_map: { [key: string]: string };
  };
  sentiment: {
    score: number;
    urgency_level: 'low' | 'medium' | 'high';
  };
}

// --- API HELPER FUNCTIONS ---
const fetchUnverifiedReports = async (getToken: () => Promise<string>): Promise<Report[]> => {
  const token = await getToken();
  const res = await apiClient.get('/reports/unverified', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

const verifyReport = async (reportId: string, getToken: () => Promise<string>) => {
  const token = await getToken();
  const res = await apiClient.put(`/reports/verify/${reportId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

const rejectReport = async (reportId: string, getToken: () => Promise<string>) => {
  const token = await getToken();
  const res = await apiClient.put(`/reports/reject/${reportId}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

const analyzeImage = async (imageUrl: string, getToken: () => Promise<string>): Promise<ImageAnalysisResult> => {
  const token = await getToken();
  
  // Fetch the image from URL and convert to blob
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  
  // Create FormData and append the image
  const formData = new FormData();
  formData.append('image', imageBlob, 'image.jpg');
  
  const res = await axios.post('http://localhost:5001/analyze_image', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data;
};

// --- HELPER FUNCTIONS ---
const getRelevanceDisplay = (classification?: Report['classification']) => {
  if (!classification) {
    return { text: 'N/A', color: 'bg-slate-100 text-slate-600 border border-slate-200' };
  }
  const { label, labels_map } = classification;
  let displayText = 'Unknown';

  if (labels_map && labels_map[label]) {
    displayText = labels_map[label].replace('_', ' ');
  } else {
    switch (label) {
      case '2': displayText = 'Highly Relevant'; break;
      case '1': displayText = 'Relevant'; break;
      case '0': displayText = 'Not Relevant'; break;
      default: displayText = `Category ${label}`;
    }
  }

  let color = 'bg-slate-100 text-slate-600 border border-slate-200';
  if (label === '2') color = 'bg-red-100 text-red-700 border border-red-200';
  else if (label === '1') color = 'bg-amber-100 text-amber-700 border border-amber-200';
  else if (label === '0') color = 'bg-sky-100 text-sky-700 border border-sky-200';

  return { text: displayText, color };
};

const getUrgencyColor = (level?: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'high': return 'bg-red-100 text-red-700 border border-red-200';
    case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'low': return 'bg-green-100 text-green-700 border border-green-200';
    default: return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

// --- MAIN COMPONENT ---
const VerificationDashboard = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [imageAnalysisLoading, setImageAnalysisLoading] = useState<string | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['unverifiedReports'],
    queryFn: () => fetchUnverifiedReports(getToken),
  });

  const verifyMutation = useMutation({
    mutationFn: (reportId: string) => verifyReport(reportId, getToken),
    onSuccess: () => {
      toast.success("Report verified successfully.");
      queryClient.invalidateQueries({ queryKey: ['unverifiedReports'] });
    },
    onError: () => toast.error("Failed to verify report."),
  });

  const rejectMutation = useMutation({
    mutationFn: (reportId: string) => rejectReport(reportId, getToken),
    onSuccess: () => {
      toast.info("Report has been rejected.");
      queryClient.invalidateQueries({ queryKey: ['unverifiedReports'] });
    },
    onError: () => toast.error("Failed to reject report."),
  });

  const handleImageAnalysis = async (report: Report) => {
    if (!report.mediaUrl) {
      toast.error("No image available for analysis.");
      return;
    }

    setImageAnalysisLoading(report._id);
    
    try {
      const analysisResult = await analyzeImage(report.mediaUrl, getToken);
      
      if (analysisResult.status === 'success') {
        // Update the report with image analysis data
        const updatedReport = {
          ...report,
          imageAnalysis: {
            caption: analysisResult.caption,
            classification: analysisResult.classification,
            sentiment: analysisResult.sentiment,
          }
        };
        
        setSelectedReport(updatedReport);
        
        // Update the reports in cache
        queryClient.setQueryData(['unverifiedReports'], (oldReports: Report[]) => {
          return oldReports?.map(r => r._id === report._id ? updatedReport : r) || [];
        });
        
        toast.success("Image analysis completed!");
      } else {
        toast.error("Failed to analyze image.");
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error("Error analyzing image. Please try again.");
    } finally {
      setImageAnalysisLoading(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading reports for verification...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800">Verification Dashboard</CardTitle>
          <CardDescription>Review and manage incoming hazard reports from the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                <TableHead className="font-semibold text-slate-600">Hazard</TableHead>
                <TableHead className="font-semibold text-slate-600">Relevance</TableHead>
                <TableHead className="font-semibold text-slate-600">Urgency</TableHead>
                <TableHead className="font-semibold text-slate-600">Reporter</TableHead>
                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                <TableHead className="font-semibold text-slate-600">Media</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports && reports.length > 0 ? reports.map((report) => {
                const relevance = getRelevanceDisplay(report.classification);
                return (
                  <TableRow key={report._id} className="even:bg-white odd:bg-slate-50/50 hover:bg-slate-100/70">
                    <TableCell>
                      <Badge variant="outline" className="capitalize border-slate-300 text-slate-700">
                        {report.hazardType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize font-medium ${relevance.color}`}>
                        {relevance.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize font-medium ${getUrgencyColor(report.sentiment?.urgency_level)}`}>
                        {report.sentiment?.urgency_level || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{report.reporterName || 'Anonymous'}</TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(report.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {report.mediaUrl && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <ImageIcon className="mr-1 h-3 w-3" />
                          Image
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={() => setSelectedReport(report)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuItem onClick={() => verifyMutation.mutate(report._id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Verify
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => rejectMutation.mutate(report._id)}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {selectedReport && selectedReport._id === report._id && (
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-slate-800">Report Details</DialogTitle>
                              <DialogDescription className="capitalize flex items-center gap-2 text-slate-500">
                                {selectedReport.hazardType.replace('_', ' ')}
                                <span className="text-slate-300">|</span>
                                <CalendarDays className="h-4 w-4 inline-block mr-1" />
                                {new Date(selectedReport.createdAt).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <Separator className="my-4" />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                              <div className="lg:col-span-3 space-y-4">
                                <div>
                                  <h4 className="font-semibold text-slate-700 mb-1">Description</h4>
                                  <p className="text-slate-600 bg-slate-50 p-3 rounded-md border">{selectedReport.description}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-700 mb-1">Location Details</h4>
                                  <p className="text-slate-600">
                                    {selectedReport.locationDescription} ({selectedReport.location.coordinates[1].toFixed(4)}, {selectedReport.location.coordinates[0].toFixed(4)})
                                  </p>
                                </div>
                                {selectedReport.mediaUrl && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-slate-700">Attached Media</h4>
                                      <Button
                                        onClick={() => handleImageAnalysis(selectedReport)}
                                        disabled={imageAnalysisLoading === selectedReport._id}
                                        size="sm"
                                        variant="outline"
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                      >
                                        {imageAnalysisLoading === selectedReport._id ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing...
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Analyze Image
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <img 
                                      src={selectedReport.mediaUrl} 
                                      alt="Hazard media" 
                                      className="rounded-md border-2 border-slate-200 max-h-64 w-full object-contain" 
                                    />
                                  </div>
                                )}

                                {/* Image Analysis Results */}
                                {selectedReport.imageAnalysis && (
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
                                      <Sparkles className="mr-2 h-4 w-4" />
                                      AI Image Analysis
                                    </h4>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm font-medium text-indigo-700">Generated Caption:</p>
                                        <p className="text-sm text-indigo-600 bg-white p-2 rounded border">
                                          {selectedReport.imageAnalysis.caption}
                                        </p>
                                      </div>
                                      <div className="flex gap-4">
                                        <div>
                                          <p className="text-sm font-medium text-indigo-700">Image Relevance:</p>
                                          <Badge className={`mt-1 ${getRelevanceDisplay(selectedReport.imageAnalysis.classification).color}`}>
                                            {getRelevanceDisplay(selectedReport.imageAnalysis.classification).text}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-indigo-700">Image Urgency:</p>
                                          <Badge className={`mt-1 ${getUrgencyColor(selectedReport.imageAnalysis.sentiment.urgency_level)}`}>
                                            {selectedReport.imageAnalysis.sentiment.urgency_level}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* AI Analysis Section */}
                              <div className="lg:col-span-2 space-y-4 rounded-lg bg-slate-100 p-4 border border-slate-200">
                                <h3 className="font-bold text-lg flex items-center text-slate-800">
                                  <BrainCircuit className="mr-2 h-5 w-5 text-indigo-500" /> Text Analysis
                                </h3>
                                {selectedReport.classification && selectedReport.sentiment ? (
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-slate-700">Text Relevance</h4>
                                      <Badge className={`capitalize mt-1 font-semibold text-base py-1 px-3 ${relevance.color}`}>
                                        {relevance.text}
                                      </Badge>
                                      <p className="text-sm text-slate-500 mt-2 flex items-center">
                                        <TrendingUp className="h-4 w-4 mr-1.5" />
                                        Certainty: {(selectedReport.classification.confidence * 100).toFixed(1)}%
                                      </p>
                                    </div>
                                    <Separator />
                                    <div>
                                      <h4 className="font-semibold text-slate-700">Text Urgency</h4>
                                      <Badge className={`capitalize mt-1 font-semibold text-base py-1 px-3 ${getUrgencyColor(selectedReport.sentiment.urgency_level)}`}>
                                        <ShieldAlert className="mr-1.5 h-4 w-4" />
                                        {selectedReport.sentiment.urgency_level}
                                      </Badge>
                                    </div>

                                    {/* Comparison Alert */}
                                    {selectedReport.imageAnalysis && (
                                      <div className="mt-4">
                                        <Alert>
                                          <BrainCircuit className="h-4 w-4" />
                                          <AlertDescription className="text-sm">
                                            <strong>Analysis Comparison:</strong><br />
                                            Text vs Image relevance: {relevance.text} vs {getRelevanceDisplay(selectedReport.imageAnalysis.classification).text}
                                          </AlertDescription>
                                        </Alert>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-slate-500">No text analysis available for this report.</p>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500">No pending reports at this time.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationDashboard;