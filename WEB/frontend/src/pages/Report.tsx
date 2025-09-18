import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSocket } from "../contexts/SocketContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  MapPin,
  AlertTriangle,
  Camera,
  Video,
  Clock,
  CheckCircle,
  Waves,
  Wind,
  Zap,
  Thermometer,
  Phone,
  User,
  X,
} from "lucide-react";

const Report = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { getToken } = useAuth();
  const { toast } = useToast();
  
  // Get user data from react-query cache
  const { data: user } = useQuery({
    queryKey: ['me'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [hazardType, setHazardType] = useState("");
  const [severity, setSeverity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  // Initialize reporter info from user data
  useEffect(() => {
    if (user) {
      const userData = user as any;
      setReporterName(`${userData.firstName || ''} ${userData.lastName || ''}`.trim());
      // Note: Phone number would need to be available in user data
      // You might need to add this field to your user profile
    }
  }, [user]);

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  useEffect(() => {
    if (!socket) return;

    const handleReportSuccess = (newReport: any) => {
      toast({
        title: "Success",
        description: t("report.submitSuccess"),
      });
      setIsSubmitting(false);
      navigate("/dashboard");
    };

    const handleReportError = (error: { message: string }) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    };

    socket.on("report-creation-success", handleReportSuccess);
    socket.on("report-creation-error", handleReportError);

    return () => {
      socket.off("report-creation-success", handleReportSuccess);
      socket.off("report-creation-error", handleReportError);
    };
  }, [socket, navigate, t, toast]);

  const handleFetchCoordinates = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude.toString());
        setLongitude(longitude.toString());
        setIsFetchingLocation(false);
        toast({
          title: "Location Found",
          description: "Your coordinates have been automatically filled.",
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Could not get your location. Please check your browser permissions.",
          variant: "destructive",
        });
        setIsFetchingLocation(false);
      }
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socket || !socket.connected) {
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "User authentication required. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        hazardType,
        severity,
        latitude,
        longitude,
        locationDescription,
        description,
        isEmergency,
        reporterName: reporterName || `${(user as any).firstName} ${(user as any).lastName}`.trim(),
        reporterPhone,
        reporterEmail: (user as any).email,
      };

      if (file) {
        const reader = new FileReader();
        reader.onload = (readEvent) => {
          const buffer = readEvent.target?.result;
          if (buffer) {
            socket.emit("create-report", {
              ...reportData,
              media: { buffer, name: file.name, type: file.type },
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        socket.emit("create-report", reportData);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Submission Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (selectedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview URL for the file
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    // Reset file input
    const fileInput = document.getElementById('media-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const hazardTypes = useMemo(() => [
    { value: 'tsunami', label: t('hazards.tsunami'), icon: Waves },
    { value: 'cyclone', label: t('hazards.cyclone'), icon: Wind },
    { value: 'pollution', label: t('hazards.pollution'), icon: AlertTriangle },
    { value: 'algae', label: t('hazards.algae'), icon: Thermometer },
    { value: 'debris', label: t('hazards.debris'), icon: AlertTriangle },
    { value: 'lightning', label: t('hazards.lightning'), icon: Zap },
    { value: 'other', label: t('hazards.other'), icon: AlertTriangle },
  ], [t]);

  const severityLevels = useMemo(() => [
    { value: 'low', label: t('severity.low'), color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: t('severity.medium'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: t('severity.high'), color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: t('severity.critical'), color: 'bg-red-100 text-red-800' },
  ], [t]);
  
  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-ocean rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('report.title')}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('report.subtitle')}</p>
          </div>
          <Card className="shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>{t('report.hazardReportDetails')}</span>
              </CardTitle>
              <CardDescription>{t('report.formDescription')}</CardDescription>
             {user && (
  <div className="text-sm text-muted-foreground">
    Reporting as: {(user as any).firstName} {(user as any).lastName} ({(user as any).email})
  </div>
)}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reporter Information Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Reporter Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reporterName">Full Name *</Label>
                      <Input 
                        id="reporterName" 
                        placeholder="Enter your full name" 
                        required 
                        value={reporterName} 
                        onChange={(e) => setReporterName(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterPhone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="reporterPhone" 
                          type="tel" 
                          placeholder="+91 98765 43210" 
                          className="pl-10" 
                          required 
                          value={reporterPhone} 
                          onChange={(e) => setReporterPhone(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">{t('report.hazardType')}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hazardTypes.map((hazard) => {
                      const Icon = hazard.icon;
                      const isSelected = hazardType === hazard.value;
                      return (
                        <label 
                          key={hazard.value} 
                          className={`relative flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="hazardType" 
                            value={hazard.value} 
                            className="sr-only" 
                            required 
                            checked={isSelected} 
                            onChange={() => setHazardType(hazard.value)} 
                          />
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {hazard.label}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="severity" className="text-base font-medium">{t('report.severityLevel')}</Label>
                  <Select value={severity} onValueChange={setSeverity} required>
                    <SelectTrigger><SelectValue placeholder={t('report.selectSeverity')} /></SelectTrigger>
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
                    <Label htmlFor="latitude">{t('report.latitude')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="latitude" 
                        type="number" 
                        step="any" 
                        placeholder="19.0760" 
                        className="pl-10" 
                        required 
                        value={latitude} 
                        onChange={(e) => setLatitude(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">{t('report.longitude')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="longitude" 
                        type="number" 
                        step="any" 
                        placeholder="72.8777" 
                        className="pl-10" 
                        required 
                        value={longitude} 
                        onChange={(e) => setLongitude(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="my-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleFetchCoordinates} 
                    disabled={isFetchingLocation}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {isFetchingLocation ? 'Fetching...' : 'Fetch My Location'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">{t('report.locationDescription')}</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g., Near Mumbai Harbor, 2km from shore" 
                    required 
                    value={locationDescription} 
                    onChange={(e) => setLocationDescription(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('report.hazardDescription')}</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe what you observed..." 
                    className="min-h-[120px]" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEmergency"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isEmergency" className="text-sm font-medium text-red-600">
                    {t('report.markAsEmergency') || 'Mark as Emergency'}
                  </Label>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">{t('report.uploadMedia')}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      id="media-upload" 
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">{t('report.clickToUpload')}</p>
                      <p className="text-xs text-muted-foreground">{t('report.maxFileSize')}</p>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="mt-4 space-y-3">
                      {/* File info bar */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith('image/') ? (
                            <Camera className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : (
                            <Video className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Preview */}
                      {filePreview && (
                        <div className="relative rounded-lg overflow-hidden bg-muted">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="w-full max-h-64 object-cover"
                            />
                          ) : (
                            <video
                              src={filePreview}
                              controls
                              className="w-full max-h-64"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                          
                          {/* Remove button overlay */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeFile}
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                  >
                    {t('report.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="px-8">
                    {isSubmitting ? t('report.submitting') : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('report.submitReport')}
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