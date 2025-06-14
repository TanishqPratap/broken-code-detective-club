
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StreamSubscriptionModal from "./StreamSubscriptionModal";

interface LivestreamViewerProps {
  streamId: string;
  creatorId: string;
}

const LivestreamViewer = ({ streamId }: LivestreamViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    fetchStreamData();
  }, [streamId, user]);

  const fetchStreamData = async () => {
    try {
      // Fetch stream details
      const { data: stream, error: streamError } = await supabase
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (streamError) throw streamError;
      setStreamData(stream);

      // Check if user has access to paid streams
      if (stream.is_paid && user) {
        const { data: subscription } = await supabase
          .from('stream_subscriptions')
          .select('*')
          .eq('stream_id', streamId)
          .eq('subscriber_id', user.id)
          .eq('status', 'active')
          .single();

        setHasAccess(!!subscription);
      } else if (!stream.is_paid) {
        setHasAccess(true);
      }
    } catch (error: any) {
      console.error('Error fetching stream data:', error);
      toast({
        title: "Error",
        description: "Failed to load stream data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    setHasAccess(true);
    setShowSubscriptionModal(false);
    fetchStreamData();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Stream Not Found</h1>
          <p className="text-gray-600">The requested stream could not be found.</p>
        </div>
      </div>
    );
  }

  // Show subscription requirement for paid streams
  if (streamData.is_paid && !hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${streamData.price}
              </Badge>
            </div>
            <CardTitle>{streamData.title}</CardTitle>
            <CardDescription>This is a paid livestream</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Subscribe to access this exclusive livestream content
            </p>
            <Button 
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full"
              disabled={!user}
            >
              {user ? "Subscribe to Watch" : "Sign in to Subscribe"}
            </Button>
            {!user && (
              <p className="text-sm text-gray-500">
                Please sign in to subscribe to this stream
              </p>
            )}
          </CardContent>
        </Card>

        <StreamSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          streamId={streamId}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{streamData.title}</h1>
            {streamData.description && (
              <p className="text-gray-600 mt-2">{streamData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {streamData.is_paid && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${streamData.price}
              </Badge>
            )}
            <Badge variant={streamData.status === 'live' ? "default" : "secondary"}>
              {streamData.status === 'live' ? "LIVE" : "OFFLINE"}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {streamData.status === 'live' ? (
                    <video
                      className="w-full h-full"
                      controls
                      autoPlay
                      muted
                    >
                      <source src={`https://livepeercdn.studio/hls/${streamData.stream_key}/index.m3u8`} type="application/x-mpegURL" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg opacity-75">Stream is offline</p>
                        <p className="text-sm opacity-50">Check back later when the creator goes live</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat/Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Viewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{streamData.viewer_count || 0}</div>
                <p className="text-sm text-gray-600">Watching now</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stream Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={streamData.status === 'live' ? "default" : "secondary"}>
                    {streamData.status}
                  </Badge>
                </div>
                {streamData.is_paid && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="text-sm font-medium">${streamData.price}</span>
                  </div>
                )}
                {streamData.started_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Started:</span>
                    <span className="text-sm">{new Date(streamData.started_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivestreamViewer;
