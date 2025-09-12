import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MapPin,
  RefreshCw,
  Waves,
  Calendar,
  Activity
} from 'lucide-react';
import apiClient from '@/lib/api';
import { useTranslation } from 'react-i18next';

// Interfaces for our data structures
interface Stat {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  color?: string;
}

interface Hotspot {
  location: string;
  reports: number;
  risk: string;
}

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [stats, setStats] = useState<Stat[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [statsRes, hotspotsRes] = await Promise.all([
          apiClient.get('/api/v1/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get('/api/v1/dashboard/hotspots', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // Add fallbacks for stats data to prevent errors if API fields are missing
        setStats([
          { title: t('dashboard.totalReports'), value: statsRes.data.totalReports || 0, trend: 'up', change: '+12%', icon: BarChart3, color: 'text-blue-500' },
          { title: t('dashboard.activeHazards'), value: statsRes.data.activeHazards || 0, trend: 'down', change: '-8%', icon: AlertTriangle, color: 'text-yellow-500' },
          { title: t('dashboard.communityMembers'), value: statsRes.data.communityMembers || 0, trend: 'up', change: '+24%', icon: Users, color: 'text-indigo-500' },
          { title: t('dashboard.responseRate'), value: statsRes.data.responseRate || '0%', trend: 'up', change: '+2%', icon: Activity, color: 'text-green-600' },
        ]);

        // The error occurred because hotspotsRes.data was not an array.
        // We now explicitly check if the received data is an array.
        // If it's not, we log an error and set an empty array to prevent the app from crashing.
        const hotspotsData = hotspotsRes.data;
        if (Array.isArray(hotspotsData)) {
          setHotspots(hotspotsData);
        } else {
          console.error("API Error: Hotspots data was not an array.", hotspotsData);
          setHotspots([]); // Set to an empty array as a safe fallback
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        // Also reset states on API failure
        setStats([]);
        setHotspots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]); // Added t to dependency array since we use it in setStats

  const getSeverityColor = (severity: string) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.title')}</h1>
              <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder={t('dashboard.selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">{t('dashboard.lastHour')}</SelectItem>
                  <SelectItem value="24h">{t('dashboard.last24h')}</SelectItem>
                  <SelectItem value="7d">{t('dashboard.last7days')}</SelectItem>
                  <SelectItem value="30d">{t('dashboard.last30days')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('dashboard.refresh')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </Card>
            ))
          ) : (
            stats.map((stat) => (
              <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color || 'text-gray-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>

        {/* Hotspots Table */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Waves className="w-6 h-6 mr-3 text-blue-500" />
                <span>{t('dashboard.hazardHotspots')}</span>
              </CardTitle>
              <CardDescription>{t('dashboard.hotspotsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('dashboard.location')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('dashboard.reports')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('dashboard.riskLevel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-gray-500">{t('dashboard.loadingHotspots')}</td>
                      </tr>
                    ) : hotspots.length > 0 ? (
                      hotspots.map((hotspot, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium text-gray-800">{hotspot.location}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-700">{hotspot.reports}</td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary" className={`font-semibold ${getSeverityColor(hotspot.risk)}`}>
                              {t(`dashboard.${hotspot.risk.toLowerCase()}`) || hotspot.risk}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-gray-500">{t('dashboard.noHotspots')}</td>
                      </tr>
                    )}
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