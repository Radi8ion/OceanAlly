import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, MapPin, AlertTriangle, Camera, Video, Clock, CheckCircle, Waves, Wind, Zap, Thermometer
} from 'lucide-react';

const Report = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [hazardType, setHazardType] = useState('');
  const [severity, setSeverity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  // --- MODIFICATION 1: Corrected Socket.IO connection and added listeners ---
  useEffect(() => {
    // Connect to the explicit backend URL. Use environment variables for production.
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl, {
      withCredentials: true, // Important for sending auth cookies/tokens if needed
    });

    setSocket(newSocket);

    // Listen for a success response from the server after submission
    const handleReportSuccess = (newReport: any) => {
      console.log('Report successfully submitted:', newReport);
      alert('Report submitted successfully!');
      setIsSubmitting(false);
      navigate('/dashboard');
    };

    // Listen for an error response from the server
    const handleReportError = (error: { message: string }) => {
      console.error('Submission error:', error);
      alert(`Submission failed: ${error.message}`);
      setIsSubmitting(false);
    };
    
    newSocket.on('report-creation-success', handleReportSuccess);
    newSocket.on('report-creation-error', handleReportError);

    // Clean up the connection and listeners when the component unmounts
    return () => {
      newSocket.off('report-creation-success', handleReportSuccess);
      newSocket.off('report-creation-error', handleReportError);
      newSocket.disconnect();
    };
  }, [navigate]);


  const hazardTypes = [
    { value: 'tsunami', label: 'Tsunami Warning', icon: Waves, color: 'destructive' },
    { value: 'cyclone', label: 'Cyclone/Storm', icon: Wind, color: 'warning' },
    { value: 'pollution', label: 'Oil Spill/Pollution', icon: AlertTriangle, color: 'destructive' },
    { value: 'algae', label: 'Harmful Algal Bloom', icon: Thermometer, color: 'warning' },
    { value: 'debris', label: 'Marine Debris', icon: AlertTriangle, color: 'secondary' },
    { value: 'lightning', label: 'Lightning Activity', icon: Zap, color: 'warning' },
    { value: 'other', label: 'Other Hazard', icon: AlertTriangle, color: 'secondary' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Risk', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Risk', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical Risk', color: 'bg-red-100 text-red-800' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  // --- MODIFICATION 2: Switched from fetch API to Socket.IO emit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !socket.connected) {
      alert('Not connected to the server. Please wait and try again.');
      return;
    }
    setIsSubmitting(true);

    // This token would be used by the backend socket auth middleware
    const token = localStorage.getItem('token');

    // Consolidate form data into a single object
    const reportData = {
      hazardType,
      severity,
      latitude,
      longitude,
      locationDescription,
      description,
      isEmergency,
      reporterName,
      reporterContact,
      token, // Send token for authentication
    };

    // If a file exists, read it as a buffer before emitting
    if (file) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const buffer = readEvent.target?.result;
        if (buffer) {
          // Emit event with text data and file data
          socket.emit('create-report', {
            ...reportData,
            media: {
              buffer,
              name: file.name,
              type: file.type,
            },
          });
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Could not read the selected file.');
        setIsSubmitting(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Emit event with only text data
      socket.emit('create-report', reportData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-ocean rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Report Ocean Hazard</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help protect our coastal communities by reporting ocean hazards in real-time
            </p>
          </div>
          <Card className="shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Hazard Report Details</span>
              </CardTitle>
              <CardDescription>Please provide as much detail as possible to help our response teams</CardDescription>
            </CardHeader>
            <CardContent>
              {/* The form tag no longer needs its own onSubmit, but we keep it for structure */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hazard Type and other fields remain the same */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Hazard Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hazardTypes.map((hazard) => {
                      const Icon = hazard.icon;
                      return (
                        <label key={hazard.value} className="relative flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-smooth">
                          <input type="radio" name="hazardType" value={hazard.value} className="sr-only"
                            required checked={hazardType === hazard.value} onChange={() => setHazardType(hazard.value)}
                          />
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">{hazard.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {/* ... other form fields like Severity, Location, etc. ... */}
                <div className="space-y-3">
                  <Label htmlFor="severity" className="text-base font-medium">Severity Level *</Label>
                  <Select value={severity} onValueChange={setSeverity} required>
                    <SelectTrigger><SelectValue placeholder="Select severity level" /></SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${level.color}`} />
                            <span>{level.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="latitude" type="number" step="any" placeholder="19.0760" className="pl-10"
                        required value={latitude} onChange={(e) => setLatitude(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="longitude" type="number" step="any" placeholder="72.8777" className="pl-10"
                        required value={longitude} onChange={(e) => setLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location Description *</Label>
                  <Input id="location" placeholder="e.g., Near Mumbai Harbor, 2km from shore" required
                    value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Hazard Description *</Label>
                  <Textarea id="description" placeholder="Describe what you observed..." className="min-h-[120px]"
                    required value={description} onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                {/* Media Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Upload Media (Photo/Video)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">Click to upload a photo or video</p>
                      <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
                    </label>
                  </div>
                  {file && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg text-sm">
                        {file.type.startsWith('image/') ? (
                          <Camera className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Video className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <span className="truncate" title={file.name}>{file.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ... Reporter Info, Emergency Checkbox, and Submit Button ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reporterName">Your Name</Label>
                      <Input id="reporterName" placeholder="John Doe"
                        value={reporterName} onChange={(e) => setReporterName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterContact">Contact Number</Label>
                      <Input id="reporterContact" type="tel" placeholder="+91 98765 43210"
                        value={reporterContact} onChange={(e) => setReporterContact(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <input type="checkbox" id="emergency" className="mt-1 rounded border-border"
                      checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="emergency" className="text-sm font-medium text-warning-foreground">
                        This is an emergency situation requiring immediate response
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check this if the hazard poses immediate danger to life or property
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>Cancel</Button>
                    {/* The form's onSubmit is now handled by the main handler */}
                    <Button type="submit" disabled={isSubmitting} className="px-8">
                      {isSubmitting ? 'Submitting...' : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;