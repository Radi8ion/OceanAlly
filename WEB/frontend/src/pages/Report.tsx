import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSocket } from "../contexts/SocketContext";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import {
  Upload, MapPin, AlertTriangle, Camera, Video, Clock, CheckCircle, Waves, Wind, Zap, Thermometer
} from 'lucide-react';

const Report = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { socket } = useSocket();
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

  useEffect(() => {
    if (!socket) return;

    const handleReportSuccess = (newReport: any) => {
      alert(t('report.submitting') + ' ' + t('report.submitReport'));
      setIsSubmitting(false);
      navigate('/dashboard');
    };

    const handleReportError = (error: { message: string }) => {
      alert(`${t('common.error')}: ${error.message}`);
      setIsSubmitting(false);
    };
    
    socket.on('report-creation-success', handleReportSuccess);
    socket.on('report-creation-error', handleReportError);

    return () => {
      socket.off('report-creation-success', handleReportSuccess);
      socket.off('report-creation-error', handleReportError);
    };
  }, [socket, navigate, t]);

  const hazardTypes = [
    { value: 'tsunami', label: t('hazards.tsunami'), icon: Waves, color: 'destructive' },
    { value: 'cyclone', label: t('hazards.cyclone'), icon: Wind, color: 'warning' },
    { value: 'pollution', label: t('hazards.pollution'), icon: AlertTriangle, color: 'destructive' },
    { value: 'algae', label: t('hazards.algae'), icon: Thermometer, color: 'warning' },
    { value: 'debris', label: t('hazards.debris'), icon: AlertTriangle, color: 'secondary' },
    { value: 'lightning', label: t('hazards.lightning'), icon: Zap, color: 'warning' },
    { value: 'other', label: t('hazards.other'), icon: AlertTriangle, color: 'secondary' },
  ];

  const severityLevels = [
    { value: 'low', label: t('severity.low'), color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: t('severity.medium'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: t('severity.high'), color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: t('severity.critical'), color: 'bg-red-100 text-red-800' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !socket.connected) {
      alert(t('common.error') + ': Not connected to server');
      return;
    }
    setIsSubmitting(true);

    const token = localStorage.getItem('token');

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
      token,
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const buffer = readEvent.target?.result;
        if (buffer) {
          socket.emit('create-report', {
            ...reportData,
            media: { buffer, name: file.name, type: file.type },
          });
        }
      };
      reader.onerror = (error) => {
        alert(t('common.error') + ': Could not read file');
        setIsSubmitting(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
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
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hazard Type */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">{t('report.hazardType')}</Label>
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

                {/* Severity */}
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

                {/* Latitude / Longitude / Location / Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">{t('report.latitude')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="latitude" type="number" step="any" placeholder="19.0760" className="pl-10"
                        required value={latitude} onChange={(e) => setLatitude(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">{t('report.longitude')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="longitude" type="number" step="any" placeholder="72.8777" className="pl-10"
                        required value={longitude} onChange={(e) => setLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t('report.locationDescription')}</Label>
                  <Input id="location" placeholder="e.g., Near Mumbai Harbor, 2km from shore" required
                    value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('report.hazardDescription')}</Label>
                  <Textarea id="description" placeholder="Describe what you observed..." className="min-h-[120px]"
                    required value={description} onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Media Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">{t('report.uploadMedia')}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">{t('report.clickToUpload')}</p>
                      <p className="text-xs text-muted-foreground">{t('report.maxFileSize')}</p>
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

                {/* Reporter Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporterName">{t('report.yourName')}</Label>
                    <Input id="reporterName" placeholder="John Doe"
                      value={reporterName} onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporterContact">{t('report.contactNumber')}</Label>
                    <Input id="reporterContact" type="tel" placeholder="+91 98765 43210"
                      value={reporterContact} onChange={(e) => setReporterContact(e.target.value)}
                    />
                  </div>
                </div>

                {/* Emergency Checkbox */}
                <div className="flex items-start space-x-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <input type="checkbox" id="emergency" className="mt-1 rounded border-border"
                    checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)}
                  />
                  <div>
                    <label htmlFor="emergency" className="text-sm font-medium text-warning-foreground">
                      {t('report.emergency')}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">{t('report.emergencyDescription')}</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>{t('report.cancel')}</Button>
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
