
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Player } from "@livepeer/react";
import { Users, Heart, MessageCircle, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LivestreamViewerProps {
  streamId: string;
  creatorId: string;
}

const LivestreamViewer = ({ streamId, creatorId }: LivestreamViewerProps) => {
  const [streamData, setStreamData] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchStreamData();
    fetchCreatorProfile();
  }, [streamId, creatorId]);

  const fetchStreamData = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      setStreamData(data);
    } catch (error) {
      console.error('Error fetching stream:', error);
    }
  };

  const fetchCreatorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      setCreatorProfile(data);
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
  };

  if (!streamData || !creatorProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading stream...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Stream Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                {streamData.status === 'live' ? (
                  <Player
                    src={`https://livepeercdn.com/hls/${streamData.stream_key}/index.m3u8`}
                    autoPlay
                    muted
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-xl mb-2">Stream Offline</div>
                      <p className="text-gray-400">This creator is not currently live</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">{streamData.title}</h1>
                  <Badge variant={streamData.status === 'live' ? "default" : "secondary"}>
                    {streamData.status === 'live' ? "LIVE" : "OFFLINE"}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4">{streamData.description}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{viewerCount} viewers</span>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Like
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Creator Info & Chat */}
        <div className="space-y-6">
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={creatorProfile.avatar_url} />
                  <AvatarFallback>{creatorProfile.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{creatorProfile.display_name}</h3>
                  <p className="text-sm text-gray-600">@{creatorProfile.username}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{creatorProfile.bio}</p>
              <Button 
                onClick={handleFollow}
                variant={isFollowing ? "outline" : "default"}
                className="w-full"
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-50 rounded-lg p-4 overflow-y-auto">
                <div className="text-center text-gray-500 text-sm">
                  Chat will appear here when the stream is live
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LivestreamViewer;
