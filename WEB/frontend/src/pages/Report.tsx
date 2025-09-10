import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Thermometer
} from 'lucide-react';

const Report = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Show success message
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-ocean rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Report Ocean Hazard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help protect our coastal communities by reporting ocean hazards in real-time
            </p>
          </div>

          {/* Report Form */}
          <Card className="shadow-elevated border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Hazard Report Details</span>
              </CardTitle>
              <CardDescription>
                Please provide as much detail as possible to help our response teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hazard Type */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Hazard Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hazardTypes.map((hazard) => {
                      const Icon = hazard.icon;
                      return (
                        <label
                          key={hazard.value}
                          className="relative flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-smooth"
                        >
                          <input
                            type="radio"
                            name="hazardType"
                            value={hazard.value}
                            className="sr-only"
                            required
                          />
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">{hazard.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Severity Level */}
                <div className="space-y-3">
                  <Label htmlFor="severity" className="text-base font-medium">Severity Level *</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
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

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="19.0760"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="72.8777"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location Description *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Near Mumbai Harbor, 2km from shore"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Hazard Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you observed, when it occurred, and any other relevant details..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                {/* Media Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Upload Media (Photos/Videos)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload photos or videos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: 50MB per file
                      </p>
                    </label>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                          {file.type.startsWith('image/') ? (
                            <Camera className="w-4 h-4 text-primary" />
                          ) : (
                            <Video className="w-4 h-4 text-primary" />
                          )}
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporterName">Your Name</Label>
                    <Input
                      id="reporterName"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporterContact">Contact Number</Label>
                    <Input
                      id="reporterContact"
                      type="tel"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Emergency Checkbox */}
                <div className="flex items-start space-x-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="emergency"
                    className="mt-1 rounded border-border"
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

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="px-8">
                    {isSubmitting ? (
                      'Submitting...'
                    ) : (
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

          {/* Help Section */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground mb-2">Emergency Situations</h3>
                  <p className="text-sm text-muted-foreground">
                    For immediate life-threatening emergencies, please call the Coast Guard at{' '}
                    <span className="font-semibold text-primary">1554</span> or local emergency services at{' '}
                    <span className="font-semibold text-primary">112</span> before submitting this report.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;