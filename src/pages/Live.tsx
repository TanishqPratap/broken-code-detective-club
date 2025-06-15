
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Play, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'offline';
  viewer_count: number;
  creator_id: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

const Live = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  const fetchLiveStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          id,
          title,
          description,
          status,
          viewer_count,
          creator_id,
          profiles:creator_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const typedStreams: LiveStream[] = (data || []).map(stream => ({
        ...stream,
        status: (stream.status === 'live' ? 'live' : 'offline') as 'live' | 'offline'
      }));
      
      setLiveStreams(typedStreams);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchStream = (streamId: string) => {
    navigate(`/watch/${streamId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading live streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Live Streams</h1>
        <p className="text-gray-600">Watch live streams from creators</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {liveStreams.map((stream) => (
          <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-12 h-12 text-white/60" />
              </div>
              <div className="absolute top-4 left-4">
                <Badge variant={stream.status === 'live' ? "default" : "secondary"}>
                  {stream.status === 'live' ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                      LIVE
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      OFFLINE
                    </>
                  )}
                </Badge>
              </div>
              {stream.status === 'live' && (
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                    <Users className="w-3 h-3 mr-1" />
                    {stream.viewer_count}
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={stream.profiles?.avatar_url} />
                  <AvatarFallback>
                    {stream.profiles?.display_name?.[0] || stream.profiles?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{stream.title}</CardTitle>
                  <p className="text-sm text-gray-600">@{stream.profiles?.username}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <CardDescription className="mb-4 line-clamp-2">
                {stream.description || "No description available"}
              </CardDescription>
              <Button 
                onClick={() => handleWatchStream(stream.id)}
                className="w-full"
                variant={stream.status === 'live' ? "default" : "outline"}
                size="sm"
              >
                {stream.status === 'live' ? 'Watch Live' : 'View Stream'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {liveStreams.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">No streams available</h3>
          <p className="text-gray-600">Check back later for live content!</p>
        </div>
      )}
    </div>
  );
};

export default Live;
