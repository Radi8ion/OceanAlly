import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react"; // Add this import
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  AlertTriangle,
  Users,
  MapPin,
  RefreshCw,
  Waves,
  Calendar,
  Activity,
  Clock,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useTranslation } from "react-i18next";
import HotspotMap from "./HotspotMap";
import LocationDisplay from "./LocationDisplay";
import { Hotspot } from "@/types";
import axios from "axios";
import { formatDistanceToNow } from 'date-fns';

interface Stat {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}

interface Video {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  location: string[];
}

// A simple delay function to help with API rate limiting
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState("24h");
  const [stats, setStats] = useState<Stat[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const { t } = useTranslation();
  const { getToken } = useAuth(); // Add Clerk's useAuth hook
  
  // State to cache location names. Key is "lat,lon", value is the address.
  const [locationCache, setLocationCache] = useState<Record<string, string>>({});

  // Fetch YouTube videos
  const fetchYouTubeVideos = async () => {
    setVideosLoading(true);
    try {
      // Remove Authorization header since Flask route doesn't require it
    const response = await axios.get("http://localhost:5001/recent-videos");
      
      console.log("Full Response:", response);
      console.log("Response Data:", response.data);
      console.log("Response Status:", response.data.status);
      console.log("Videos Array:", response.data.videos);
      console.log("Number of Videos:", response.data.videos?.length || 0);
      
      if (response.data.status === 'success') {
        setVideos(response.data.videos || []);
      } else {
        console.error("YouTube API Error:", response.data.message);
        setVideos([]);
      }
    } catch (error) {
      console.error("Failed to fetch YouTube videos", error);
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get token from Clerk instead of localStorage
        const token = await getToken();
        
        if (!token) {
          console.error("No authentication token available");
          setStats([]);
          setHotspots([]);
          return;
        }

        const [statsRes, hotspotsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/v1/dashboard/stats", { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get("http://localhost:5000/api/v1/dashboard/hotspots", { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
        ]);
        
        console.log(hotspotsRes);
        
        setStats([
          { title: t("dashboard.totalReports"), value: statsRes.data.totalReports || 0, icon: BarChart3, color: "text-blue-500" },
          { title: t("dashboard.activeHazards"), value: statsRes.data.activeHazards || 0, icon: AlertTriangle, color: "text-yellow-500" },
          { title: t("dashboard.communityMembers"), value: statsRes.data.communityMembers || 0, icon: Users, color: "text-indigo-500" },
          { title: t("dashboard.responseRate"), value: statsRes.data.responseRate || "0%", icon: Activity, color: "text-green-600" },
        ]);

        const hotspotsData = hotspotsRes.data;
        if (Array.isArray(hotspotsData)) {
          setHotspots(hotspotsData);
        } else {
          console.error("API Error: Hotspots data was not an array.", hotspotsData);
          setHotspots([]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setStats([]);
        setHotspots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchYouTubeVideos();
  }, [t, getToken]); // Add getToken to dependency array

  // A separate useEffect to handle fetching location names for the hotspots table
  useEffect(() => {
    const fetchAllLocationNames = async () => {
      // Create a list of locations that are not yet in our cache
      const locationsToFetch = hotspots.filter(h => !locationCache[h.center.join(',')]);

      if (locationsToFetch.length === 0) return;

      // Process each location one by one to avoid rate limiting
      for (const hotspot of locationsToFetch) {
        const [latitude, longitude] = hotspot.center;
        const cacheKey = hotspot.center.join(',');
        
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          const response = await axios.get(url);
          
          if (response.data && response.data.display_name) {
            // Add the fetched name to our cache
            setLocationCache(prevCache => ({ ...prevCache, [cacheKey]: response.data.display_name }));
          } else {
            // If the API returns no name, use a fallback
             setLocationCache(prevCache => ({ ...prevCache, [cacheKey]: `Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}` }));
          }
        } catch (error) {
          console.error(`Failed to fetch location for ${cacheKey}`, error);
          // Add an error message to the cache so we don't try again
          setLocationCache(prevCache => ({ ...prevCache, [cacheKey]: "Location unavailable" }));
        }

        // Wait for 1 second before the next request to respect API limits
        await delay(1000); 
      }
    };

    if (hotspots.length > 0 && !loading) {
      fetchAllLocationNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotspots, loading]); // This effect runs when hotspots are loaded

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        console.error("No authentication token available");
        return;
      }

      const [statsRes, hotspotsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/v1/dashboard/stats", { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get("http://localhost:5000/api/v1/dashboard/hotspots", { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);
      
      setStats([
        { title: t("dashboard.totalReports"), value: statsRes.data.totalReports || 0, icon: BarChart3, color: "text-blue-500" },
        { title: t("dashboard.activeHazards"), value: statsRes.data.activeHazards || 0, icon: AlertTriangle, color: "text-yellow-500" },
        { title: t("dashboard.communityMembers"), value: statsRes.data.communityMembers || 0, icon: Users, color: "text-indigo-500" },
        { title: t("dashboard.responseRate"), value: statsRes.data.responseRate || "0%", icon: Activity, color: "text-green-600" },
      ]);

      const hotspotsData = hotspotsRes.data;
      if (Array.isArray(hotspotsData)) {
        setHotspots(hotspotsData);
      } else {
        console.error("API Error: Hotspots data was not an array.", hotspotsData);
        setHotspots([]);
      }
    } catch (error) {
      console.error("Failed to refresh dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVideos = () => {
    fetchYouTubeVideos();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t("dashboard.title")}</h1>
              <p className="text-gray-500 mt-1">{t("dashboard.subtitle")}</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder={t("dashboard.selectPeriod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">{t("dashboard.lastHour")}</SelectItem>
                  <SelectItem value="24h">{t("dashboard.last24h")}</SelectItem>
                  <SelectItem value="7d">{t("dashboard.last7days")}</SelectItem>
                  <SelectItem value="30d">{t("dashboard.last30days")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t("dashboard.refresh")}
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
                      <stat.icon className={`w-6 h-6 ${stat.color || "text-gray-600"}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>

        {/* Map and YouTube Feed Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Live Hotspots Map */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <MapPin className="w-6 h-6 mr-3 text-green-600" />
                  <span>Live Hotspots Map</span>
                </CardTitle>
                <CardDescription>Real-time map of hazard clusters.</CardDescription>
              </CardHeader>
              <CardContent>
                <HotspotMap hotspots={hotspots} />
              </CardContent>
            </Card>
          </div>

          {/* YouTube Feed */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
                    <Waves className="w-6 h-6 mr-3 text-red-500" />
                    YouTube Feed
                    {videos.length > 0 && (
                      <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">{videos.length}</span>
                    )}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleRefreshVideos} disabled={videosLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${videosLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <CardDescription>Recent coastal hazard videos from India</CardDescription>
              </CardHeader>
              <CardContent>
                {videosLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-3 rounded-lg bg-slate-50 animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {videos.map((video, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start gap-3">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80" 
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-semibold text-slate-800 text-sm line-clamp-2 cursor-pointer hover:text-blue-600"
                              onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                            >
                              {video.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                              {video.description.length > 80 
                                ? `${video.description.substring(0, 80)}...` 
                                : video.description}
                            </p>
                            {video.location && video.location.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-700 font-medium">
                                  {video.location.join(', ')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
                              </div>
                              <ExternalLink 
                                className="w-3 h-3 text-gray-400 hover:text-blue-600 cursor-pointer"
                                onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Waves className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No videos available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Hotspots Table */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Waves className="w-6 h-6 mr-3 text-blue-500" />
                <span>{t("dashboard.hazardHotspots")}</span>
              </CardTitle>
              <CardDescription>{t("dashboard.hotspotsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">{t("dashboard.location")}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">{t("dashboard.reports")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={2} className="text-center py-8 text-gray-500">{t("dashboard.loadingHotspots")}</td></tr>
                    ) : hotspots.length > 0 ? (
                      hotspots.map((hotspot, index) => {
                        const cacheKey = hotspot.center.join(',');
                        const locationName = locationCache[cacheKey];
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50/50">
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                <LocationDisplay locationName={locationName} />
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{hotspot.report_count}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={2} className="text-center py-8 text-gray-500">{t("dashboard.noHotspots")}</td></tr>
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