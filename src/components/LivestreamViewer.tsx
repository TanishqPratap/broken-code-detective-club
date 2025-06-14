
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Heart, MessageCircle, Share, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StreamSubscriptionModal from "./StreamSubscriptionModal";

interface LivestreamViewerProps {
  streamId: string;
  creatorId: string;
}

const LivestreamViewer = ({ streamId, creatorId }: LivestreamViewerProps) => {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreamData();
    fetchCreatorProfile();
    if (user) {
      checkStreamAccess();
    }
  }, [streamId, creatorId, user]);

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
    } finally {
      setLoading(false);
    }
  };

  const checkStreamAccess = async () => {
    if (!user) return;

    try {
      // Check if user has an active subscription for this stream
      const { data, error } = await supabase
        .from('stream_subscriptions')
        .select('*')
        .eq('stream_id', streamId)
        .eq('subscriber_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .limit(1);

      if (error) throw error;
      setHasAccess(data && data.length > 0);
    } catch (error) {
      console.error('Error checking stream access:', error);
    }
  };

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
  };

  const handleSubscribe = () => {
    if (!user) {
      // Handle authentication required
      return;
    }
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    setHasAccess(true);
    checkStreamAccess();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading stream...</div>
      </div>
    );
  }

  if (!streamData || !creatorProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Stream not found</div>
      </div>
    );
  }

  const playbackUrl = streamData.status === 'live' 
    ? `https://livepeercdn.studio/hls/${streamData.stream_key}/index.m3u8`
    : null;

  const canWatchStream = hasAccess || streamData.creator_id === user?.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Stream Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative">
                {streamData.status === 'live' && playbackUrl && canWatchStream ? (
                  <video
                    src={playbackUrl}
                    autoPlay
                    muted
                    className="w-full h-full"
                    controls
                  />
                ) : streamData.status === 'live' && !canWatchStream ? (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
                    <div className="text-center">
                      <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <div className="text-xl mb-2">Premium Content</div>
                      <p className="text-gray-400 mb-4">Subscribe to watch this livestream</p>
                      <Button onClick={handleSubscribe} size="lg">
                        Subscribe to Watch
                      </Button>
                    </div>
                  </div>
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
                  
                  {canWatchStream && (
                    <>
                      <Button variant="outline" size="sm">
                        <Heart className="w-4 h-4 mr-2" />
                        Like
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </>
                  )}
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
              <div className="space-y-2">
                <Button 
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className="w-full"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                
                {!canWatchStream && streamData.status === 'live' && (
                  <Button onClick={handleSubscribe} className="w-full">
                    Subscribe to Watch
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Chat */}
          {canWatchStream && (
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
          )}
        </div>
      </div>

      <StreamSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        streamId={streamId}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default LivestreamViewer;
