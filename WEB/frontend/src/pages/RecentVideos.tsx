// src/pages/RecentVideos.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Waves } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RecentVideos = ({ videos, isLoading, onRefresh }) => {
  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
            <Waves className="w-6 h-6 mr-3 text-blue-500" />
            YouTube Feed
            {videos.length > 0 && (
              <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">{videos.length}</span>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : videos.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {videos.map((video, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-start gap-3">
                  <img src={video.thumbnail} alt={video.title} className="w-16 h-16 object-cover rounded" />
                  <div>
                    <h3 className="font-semibold text-slate-800">{video.title}</h3>
                    <p className="text-sm text-slate-600">{video.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Waves className="w-12 h-12 mx-auto mb-4" />
            <p>No videos available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentVideos;
