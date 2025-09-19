import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw, ExternalLink, Heart, MessageCircle, AlertCircle,
  Play, Eye, ThumbsUp, MapPin, Clock, Users,
} from "lucide-react";
import { Youtube } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from 'date-fns';

// --- INTERFACES ---
interface RedditPost {
  id: string; 
  title: string; 
  selftext: string; 
  created_utc: number; 
  author: string;
  score: number; 
  num_comments: number; 
  url: string; 
  subreddit: string; 
  thumbnail?: string;
}

interface GNewsArticle {
  title: string; 
  description: string; 
  url: string; 
  image: string;
  publishedAt: string; 
  source: { name: string; url: string; };
}

interface YouTubeVideo {
  videoId: string; 
  title: string; 
  description: string; 
  publishedAt: string;
  thumbnail: string; 
  location: string[]; 
  channelTitle?: string;
  viewCount?: string; 
  likeCount?: string; 
  commentCount?: string;
}

interface FeedsData {
  reddit: { status: string; data: RedditPost[]; count: number };
  gnews: { status: string; data: GNewsArticle[]; count: number };
  youtube: { status: string; data: YouTubeVideo[]; count: number };
}

const LiveFeeds = () => {
  const [feedsData, setFeedsData] = useState<FeedsData>({
    reddit: { status: "loading", data: [], count: 0 },
    gnews: { status: "loading", data: [], count: 0 },
    youtube: { status: "loading", data: [], count: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { getToken } = useAuth();

  const safeFormatDate = (dateSource: string | number | undefined | null) => {
    if (!dateSource) return 'Unknown time';
    try {
      const date = typeof dateSource === 'number' ? new Date(dateSource * 1000) : new Date(dateSource);
      if (isNaN(date.getTime())) return 'Unknown time';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Invalid date:', dateSource, error);
      return 'Unknown time';
    }
  };

  const formatNumber = (num: string | number | undefined) => {
    if (!num) return '0';
    const numValue = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(numValue)) return '0';
    return numValue.toLocaleString();
  };

  const fetchLiveFeeds = async () => {
    try {
      const response = await axios.get("http://localhost:5001/live-feeds");
      const { feeds, last_updated } = response.data;
      
      console.log('Feeds response:', feeds); // Debug log
      
      setFeedsData({
        reddit: feeds.reddit || { status: "error", data: [], count: 0 },
        gnews: feeds.gnews || { status: "error", data: [], count: 0 },
        youtube: feeds.youtube || { status: "error", data: [], count: 0 }
      });

      if (last_updated) {
        setLastUpdated(new Date(last_updated));
      }
    } catch (error) {
      console.error("Failed to fetch live feeds:", error);
      setFeedsData({
        reddit: { status: "error", data: [], count: 0 },
        gnews: { status: "error", data: [], count: 0 },
        youtube: { status: "error", data: [], count: 0 }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveFeeds();
  };

  useEffect(() => {
    fetchLiveFeeds();
    const interval = setInterval(fetchLiveFeeds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getTotalPostsCount = () => {
    return Object.values(feedsData).reduce((total, feed) => total + (feed.count || 0), 0);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit': return <img src="https://www.reddit.com/favicon.ico" alt="Reddit" className="w-5 h-5" />;
      case 'gnews': return <img src="https://imgs.search.brave.com/MRqy8-RSCeiazO-CNSkwXSZCmFvMLYn6lcZyAJ8E-gI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTU3NDcvMTU3/NDcxNjEucG5n" alt="GNews" className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const LoadingCard = () => (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ErrorMessage = ({ platform }: { platform: string }) => (
    <div className="text-center py-8 text-gray-500">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p className="text-sm">Failed to load {platform} feed</p>
    </div>
  );

  const EmptyMessage = ({ platform }: { platform: string }) => (
    <div className="text-center py-8 text-gray-500">
      {getPlatformIcon(platform)}
      <div className="mt-4">
        <p className="text-sm">No recent {platform} content available</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Live Feeds</h1>
              <p className="text-gray-500 mt-1">Real-time disaster and climate-related content</p>
              {lastUpdated && <p className="text-sm text-gray-400 mt-1">Last updated: {safeFormatDate(lastUpdated.toISOString())}</p>}
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                {getTotalPostsCount()} Total Posts
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(feedsData).map(([platform, feed]) => (
            <Card key={platform} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 capitalize">{platform}</p>
                    <p className="text-xl font-bold text-gray-800">{feed.count}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">{getPlatformIcon(platform)}</div>
                </div>
                <div className="mt-2">
                  <Badge variant={feed.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                    {feed.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Content Feeds</CardTitle>
              <CardDescription>Browse content across different platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="reddit" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="reddit" className="flex items-center gap-2">
                    {getPlatformIcon('reddit')}Reddit
                  </TabsTrigger>
                  <TabsTrigger value="gnews" className="flex items-center gap-2">
                    {getPlatformIcon('gnews')}GNews
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2">
                    {getPlatformIcon('youtube')}YouTube
                  </TabsTrigger>
                </TabsList>

                {/* --- REDDIT CONTENT --- */}
                <TabsContent value="reddit" className="mt-6">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {loading ? Array.from({ length: 3 }).map((_, idx) => <LoadingCard key={idx} />)
                      : feedsData.reddit.status === 'error' ? <ErrorMessage platform="Reddit" />
                      : feedsData.reddit.data.length === 0 ? <EmptyMessage platform="Reddit" />
                      : (feedsData.reddit.data.map((post, idx) => (
                          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                  {post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && (
                                    <div className="flex-shrink-0">
                                      <img 
                                        src={post.thumbnail} 
                                        alt={post.title} 
                                        className="w-full sm:w-24 h-auto sm:h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(post.url, "_blank")}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-blue-600 mb-2"
                                      onClick={() => window.open(post.url, "_blank")}>
                                      {post.title}
                                    </h3>
                                    {post.selftext && (
                                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                        {post.selftext}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                          <Heart className="w-3 h-3" />
                                          {formatNumber(post.score)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="w-3 h-3" />
                                          {formatNumber(post.num_comments)}
                                        </div>
                                        <span>r/{post.subreddit}</span>
                                        <span>by u/{post.author}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {safeFormatDate(post.created_utc)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )))}
                  </div>
                </TabsContent>

                {/* --- GNEWS CONTENT --- */}
                <TabsContent value="gnews" className="mt-6">
                   <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                     {loading ? Array.from({ length: 3 }).map((_, idx) => <LoadingCard key={idx} />)
                      : feedsData.gnews.status === 'error' ? <ErrorMessage platform="GNews" />
                      : feedsData.gnews.data.length === 0 ? <EmptyMessage platform="GNews" />
                      : (feedsData.gnews.data.map((article, idx) => (
                          <motion.div key={article.url} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                             <Card className="hover:shadow-md transition-shadow">
                               <CardContent className="p-4">
                                 <div className="flex flex-col sm:flex-row items-start gap-4">
                                   {article.image && (
                                     <div className="flex-shrink-0">
                                       <img 
                                         src={article.image} 
                                         alt={article.title} 
                                         className="w-full sm:w-32 h-auto sm:h-20 object-cover rounded cursor-pointer hover:opacity-80"
                                         onClick={() => window.open(article.url, "_blank")}
                                       />
                                     </div>
                                   )}
                                   <div className="flex-1 min-w-0">
                                     <h3 className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-blue-600 mb-2"
                                       onClick={() => window.open(article.url, "_blank")}>
                                       {article.title}
                                     </h3>
                                     <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                       {article.description}
                                     </p>
                                     <div className="flex items-center justify-between">
                                       <span className="text-xs text-gray-500">{article.source.name}</span>
                                       <div className="flex items-center gap-1 text-xs text-gray-500">
                                         <Clock className="w-3 h-3" />
                                         {safeFormatDate(article.publishedAt)}
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               </CardContent>
                             </Card>
                          </motion.div>
                      )))}
                  </div>
                </TabsContent>

                {/* --- YOUTUBE CONTENT --- */}
                <TabsContent value="youtube" className="mt-6">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {loading ? Array.from({ length: 3 }).map((_, idx) => <LoadingCard key={idx} />)
                      : feedsData.youtube.status === 'error' ? <ErrorMessage platform="YouTube" />
                      : feedsData.youtube.data.length === 0 ? <EmptyMessage platform="YouTube" />
                      : (feedsData.youtube.data.map((video, idx) => (
                        <motion.div key={video.videoId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="relative flex-shrink-0">
                                  <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className="w-full sm:w-40 h-auto sm:h-24 object-cover rounded cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, "_blank")}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded pointer-events-none">
                                    <Play className="w-8 h-8 text-white opacity-90" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-red-600 mb-1"
                                    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, "_blank")}>
                                    {video.title}
                                  </h3>
                                  {video.channelTitle && (
                                    <span className="text-xs text-gray-600 mb-2 block">{video.channelTitle}</span>
                                  )}
                                  {video.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                      {video.description}
                                    </p>
                                  )}
                                  {video.location && video.location.length > 0 && (
                                    <div className="flex items-center gap-1 mb-2">
                                      <MapPin className="w-3 h-3 text-green-600" />
                                      <span className="text-xs text-green-700 font-medium">{video.location.join(", ")}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      {video.viewCount && (
                                        <div className="flex items-center gap-1">
                                          <Eye className="w-3 h-3" />
                                          {formatNumber(video.viewCount)}
                                        </div>
                                      )}
                                      {video.likeCount && (
                                        <div className="flex items-center gap-1">
                                          <ThumbsUp className="w-3 h-3" />
                                          {formatNumber(video.likeCount)}
                                        </div>
                                      )}
                                      {video.commentCount && (
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="w-3 h-3" />
                                          {formatNumber(video.commentCount)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      {safeFormatDate(video.publishedAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )))}
                  </div>
                </TabsContent>
                
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveFeeds;