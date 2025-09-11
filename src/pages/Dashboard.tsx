import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MapPin,
  Clock,
  Filter,
  RefreshCw,
  Waves,
  Wind,
  Thermometer,
  Zap,
  Calendar,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  const stats = [
    {
      title: 'Total Reports',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: BarChart3,
      color: 'text-primary',
    },
    {
      title: 'Active Hazards',
      value: '23',
      change: '-8%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-warning',
    },
    {
      title: 'Community Members',
      value: '15,234',
      change: '+24%',
      trend: 'up',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Response Rate',
      value: '98.5%',
      change: '+2%',
      trend: 'up',
      icon: Activity,
      color: 'text-green-600',
    },
  ];

  const recentReports = [
    {
      id: 'R001',
      type: 'Cyclone Warning',
      location: 'Mumbai Coast',
      severity: 'High',
      time: '15 min ago',
      status: 'Active',
      icon: Wind,
    },
    {
      id: 'R002',
      type: 'Oil Spill',
      location: 'Chennai Harbor',
      severity: 'Critical',
      time: '32 min ago',
      status: 'Investigating',
      icon: AlertTriangle,
    },
    {
      id: 'R003',
      type: 'Algal Bloom',
      location: 'Kochi Waters',
      severity: 'Medium',
      time: '1 hr ago',
      status: 'Monitoring',
      icon: Thermometer,
    },
    {
      id: 'R004',
      type: 'Lightning Activity',
      location: 'Visakhapatnam',
      severity: 'High',
      time: '2 hrs ago',
      status: 'Resolved',
      icon: Zap,
    },
  ];

  const hotspots = [
    { location: 'Mumbai Coast', reports: 45, risk: 'High' },
    { location: 'Chennai Harbor', reports: 38, risk: 'Critical' },
    { location: 'Kochi Waters', reports: 29, risk: 'Medium' },
    { location: 'Kolkata Port', reports: 22, risk: 'Low' },
    { location: 'Goa Beaches', reports: 18, risk: 'Medium' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'monitoring': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Ocean Hazard Dashboard</h1>
              <p className="text-muted-foreground">Real-time monitoring and analytics</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-card border-border hover:shadow-elevated transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">vs last period</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>Live Hazard Map</span>
                    </CardTitle>
                    <CardDescription>Real-time hazard locations and hotspots</CardDescription>
                  </div>
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Hazards</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Interactive Map View</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Map integration placeholder - would show real-time hazard locations
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
                      {[
                        { label: 'Critical', color: 'bg-red-500', count: 3 },
                        { label: 'High Risk', color: 'bg-orange-500', count: 8 },
                        { label: 'Medium', color: 'bg-yellow-500', count: 12 },
                        { label: 'Low Risk', color: 'bg-green-500', count: 23 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-xs text-muted-foreground">{item.label}: {item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Recent Reports</span>
                </CardTitle>
                <CardDescription>Latest hazard reports from the community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map((report) => {
                    const Icon = report.icon;
                    return (
                      <div key={report.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted transition-smooth">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {report.type}
                            </p>
                            <Badge variant="secondary" className={getSeverityColor(report.severity)}>
                              {report.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{report.location}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{report.time}</span>
                            <Badge variant="outline" className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Hotspots Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Waves className="w-5 h-5 text-primary" />
                <span>Hazard Hotspots</span>
              </CardTitle>
              <CardDescription>Areas with highest concentration of reported hazards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reports</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Risk Level</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotspots.map((hotspot, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-smooth">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{hotspot.location}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-foreground">{hotspot.reports}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className={getSeverityColor(hotspot.risk)}>
                            {hotspot.risk}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;