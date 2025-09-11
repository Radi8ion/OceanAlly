import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Users, 
  FileText, 
  TrendingUp, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  MessageSquare,
  Bot,
  AlertTriangle,
  MapPin
} from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock admin data
  const stats = {
    totalReports: 1247,
    pendingReviews: 23,
    activeUsers: 5689,
    verifiedReports: 1156
  };

  const pendingReports = [
    {
      id: '1',
      title: 'Large Oil Spill Near Port',
      reporter: 'citizen.user@email.com',
      location: 'Chennai Port, Tamil Nadu',
      timestamp: '2024-01-15 14:30',
      severity: 'critical',
      evidenceCount: 3,
      socialMentions: 127
    },
    {
      id: '2',
      title: 'Unusual Wave Patterns',
      reporter: 'fisherman.kumar@email.com',
      location: 'Visakhapatnam Coast',
      timestamp: '2024-01-15 12:15',
      severity: 'medium',
      evidenceCount: 1,
      socialMentions: 34
    },
    {
      id: '3',
      title: 'Marine Debris Accumulation',
      reporter: 'tourist.beach@email.com',
      location: 'Goa Beaches',
      timestamp: '2024-01-15 10:45',
      severity: 'low',
      evidenceCount: 2,
      socialMentions: 8
    }
  ];

  const socialAnalytics = [
    {
      platform: 'Twitter',
      mentions: 1250,
      sentiment: 'negative',
      trending: ['#oilspill', '#marinepollution', '#coastalcleanup']
    },
    {
      platform: 'Facebook',
      mentions: 890,
      sentiment: 'neutral',
      trending: ['ocean safety', 'coastal alerts', 'marine conservation']
    },
    {
      platform: 'Instagram',
      mentions: 567,
      sentiment: 'positive',
      trending: ['#saveoceans', '#marinelife', '#cleanseas']
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Monitor reports, manage users, and oversee system analytics</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'text-blue-600' },
              { label: 'Pending Reviews', value: stats.pendingReviews, icon: Clock, color: 'text-yellow-600' },
              { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-green-600' },
              { label: 'Verified Reports', value: stats.verifiedReports, icon: CheckCircle, color: 'text-purple-600' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                        </div>
                        <Icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reports">Pending Reports</TabsTrigger>
              <TabsTrigger value="analytics">Social Analytics</TabsTrigger>
              <TabsTrigger value="ai-console">AI Console</TabsTrigger>
              <TabsTrigger value="system">System Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reports</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Reports List */}
              <div className="space-y-4">
                {pendingReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-elevated transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="w-5 h-5 text-primary mt-1" />
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground">{report.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                  <span>Reporter: {report.reporter}</span>
                                  <span className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{report.location}</span>
                                  </span>
                                  <span>{report.timestamp}</span>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant={getSeverityColor(report.severity)}>
                                    {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {report.evidenceCount} evidence files
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {report.socialMentions} social mentions
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            <Button variant="outline" size="sm">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button variant="outline" size="sm">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {socialAnalytics.map((analytics, index) => (
                  <motion.div
                    key={analytics.platform}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{analytics.platform}</CardTitle>
                          <Badge className={getSentimentColor(analytics.sentiment)}>
                            {analytics.sentiment}
                          </Badge>
                        </div>
                        <CardDescription>
                          {analytics.mentions.toLocaleString()} mentions in the last 24h
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Trending Topics:</p>
                          {analytics.trending.map((topic, i) => (
                            <Badge key={i} variant="outline" className="mr-1">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai-console" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="w-5 h-5" />
                    <span>AI Assistant Console</span>
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis and automated report processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">Automated Threat Detection</h4>
                          <p className="text-sm text-muted-foreground">
                            AI model processing 127 new reports with 94.5% accuracy
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">Social Media Sentiment</h4>
                          <p className="text-sm text-muted-foreground">
                            Real-time sentiment analysis across 15,000+ social posts
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Recent AI Insights</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Detected potential oil spill pattern near Chennai (Confidence: 87%)</li>
                        <li>• Identified unusual wave activity in Bay of Bengal (Confidence: 92%)</li>
                        <li>• Flagged coordinated social media disinformation campaign (Confidence: 78%)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>System Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Response Time</span>
                        <span className="text-sm font-medium">127ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database Health</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Optimal</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Connections</span>
                        <span className="text-sm font-medium">2,341</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Usage Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Reports Today</span>
                        <span className="text-sm font-medium">47</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New User Registrations</span>
                        <span className="text-sm font-medium">23</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Storage Used</span>
                        <span className="text-sm font-medium">67.8 GB</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;