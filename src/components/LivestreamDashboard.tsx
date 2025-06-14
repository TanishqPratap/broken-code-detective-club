import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Play, Square, Users, Eye, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const LivestreamDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [isPaidStream, setIsPaidStream] = useState(false);
  const [streamPrice, setStreamPrice] = useState("9.99");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isCreatingStream, setIsCreatingStream] = useState(false);

  const saveStreamToDatabase = async (
    livepeerStreamId: string,
    streamKey: string,
    playbackId: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .insert({
          creator_id: user.id,
          title: streamTitle,
          description: streamDescription,
          stream_key: streamKey,
          playback_id: playbackId, // Store the playbackId!
          status: 'offline',
          is_paid: isPaidStream,
          price: isPaidStream ? parseFloat(streamPrice) : null
        });

      if (error) throw error;
      
      setStreamData({
        id: livepeerStreamId,
        streamKey: streamKey,
        playbackId: playbackId,
        playbackUrl: `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`,
        rtmpIngestUrl: `rtmp://rtmp.livepeer.studio/live/${streamKey}`,
        isPaid: isPaidStream,
        price: isPaidStream ? parseFloat(streamPrice) : null
      });

      console.log('Stream saved to database successfully');
    } catch (error: any) {
      console.error('Error saving stream:', error);
      toast({
        title: "Error",
        description: "Failed to save stream data",
        variant: "destructive",
      });
    }
  };

  const handleCreateStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stream title",
        variant: "destructive",
      });
      return;
    }

    if (isPaidStream && (!streamPrice || parseFloat(streamPrice) <= 0)) {
      toast({
        title: "Error",
        description: "Please enter a valid price for paid stream",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingStream(true);
    
    try {
      console.log('Creating stream with Livepeer...');
      const { data, error } = await supabase.functions.invoke('livepeer-stream', {
        body: {
          action: 'create',
          streamData: {
            title: streamTitle,
            description: streamDescription
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Livepeer stream created:', data);
      await saveStreamToDatabase(data.id, data.streamKey, data.playbackId);
      
      toast({
        title: "Stream Created",
        description: `Your ${isPaidStream ? 'paid' : 'free'} stream has been created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast({
        title: "Error",
        description: `Failed to create stream: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingStream(false);
    }
  };

  const handleStartStream = async () => {
    if (!streamData || !user) {
      console.error('Missing stream data or user');
      return;
    }

    try {
      console.log('Starting stream...');
      const { error } = await supabase
        .from('live_streams')
        .update({
          status: 'live',
          started_at: new Date().toISOString()
        })
        .eq('creator_id', user.id)
        .eq('stream_key', streamData.streamKey);

      if (error) throw error;

      setIsStreaming(true);
      toast({
        title: "Stream Started",
        description: "Your livestream is now live!",
      });
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast({
        title: "Error",
        description: "Failed to start stream",
        variant: "destructive",
      });
    }
  };

  const handleEndStream = async () => {
    if (!streamData || !user) {
      console.error('Missing stream data or user');
      return;
    }

    try {
      console.log('Ending stream...');
      const { error } = await supabase
        .from('live_streams')
        .update({
          status: 'offline',
          ended_at: new Date().toISOString()
        })
        .eq('creator_id', user.id)
        .eq('stream_key', streamData.streamKey);

      if (error) throw error;

      setIsStreaming(false);
      toast({
        title: "Stream Ended",
        description: "Your livestream has ended",
      });
    } catch (error: any) {
      console.error('Error ending stream:', error);
      toast({
        title: "Error",
        description: "Failed to end stream",
        variant: "destructive",
      });
    }
  };

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Livestream Dashboard</h1>
          <p className="text-gray-600">Please sign in to access the livestream dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Livestream Dashboard</h1>
        <div className="flex items-center gap-4">
          {streamData?.isPaid && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${streamData.price}
            </Badge>
          )}
          <Badge variant={isStreaming ? "default" : "secondary"}>
            {isStreaming ? "LIVE" : "OFFLINE"}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Stream Setup */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stream Setup</CardTitle>
              <CardDescription>Configure your livestream settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Stream Title</Label>
                <Input
                  id="title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter your stream title"
                  disabled={isStreaming}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="Describe your stream"
                  disabled={isStreaming}
                />
              </div>

              {/* Paid Stream Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="paid-stream">Paid Stream</Label>
                    <p className="text-sm text-gray-600">Charge viewers to access your stream</p>
                  </div>
                  <Switch
                    id="paid-stream"
                    checked={isPaidStream}
                    onCheckedChange={setIsPaidStream}
                    disabled={isStreaming || !!streamData}
                  />
                </div>

                {isPaidStream && (
                  <div>
                    <Label htmlFor="price">Stream Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={streamPrice}
                      onChange={(e) => setStreamPrice(e.target.value)}
                      placeholder="9.99"
                      disabled={isStreaming || !!streamData}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      One-time payment for 24-hour access to this stream
                    </p>
                  </div>
                )}
              </div>
              
              {!streamData ? (
                <Button 
                  onClick={handleCreateStream} 
                  disabled={isCreatingStream}
                  className="w-full"
                >
                  {isCreatingStream ? "Creating..." : `Create ${isPaidStream ? 'Paid' : 'Free'} Stream`}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium">RTMP Ingest URL</Label>
                    <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                      {streamData.rtmpIngestUrl}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium">Stream Key</Label>
                    <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                      {streamData.streamKey}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isStreaming ? (
                      <Button onClick={handleStartStream} className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Start Stream
                      </Button>
                    ) : (
                      <Button onClick={handleEndStream} variant="destructive" className="flex-1">
                        <Square className="w-4 h-4 mr-2" />
                        End Stream
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stream Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Stream Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    {viewerCount}
                  </div>
                  <p className="text-sm text-gray-600">Current Viewers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5" />
                    0
                  </div>
                  <p className="text-sm text-gray-600">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stream Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Stream Preview</CardTitle>
              <CardDescription>Preview your livestream</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                {streamData && isStreaming ? (
                  <video
                    src={streamData.playbackUrl}
                    autoPlay
                    muted
                    className="w-full h-full rounded-lg"
                    controls
                    onError={(e) => {
                      console.error('Video playback error:', e);
                    }}
                    onLoadStart={() => {
                      console.log('Video loading started');
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="opacity-75">
                      {streamData ? "Click 'Start Stream' to begin broadcasting" : "Create a stream to get started"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LivestreamDashboard;
