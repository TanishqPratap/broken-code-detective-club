
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const LivestreamDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isCreatingStream, setIsCreatingStream] = useState(false);

  const saveStreamToDatabase = async (streamKey: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .insert({
          creator_id: user.id,
          title: streamTitle,
          description: streamDescription,
          stream_key: streamKey,
          status: 'offline'
        });

      if (error) throw error;
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

    setIsCreatingStream(true);
    
    try {
      // For now, create a mock stream until we have proper Livepeer integration
      const mockStream = {
        streamKey: `stream_${Date.now()}`,
        playbackUrl: `https://livepeercdn.com/hls/stream_${Date.now()}/index.m3u8`
      };
      
      setStreamData(mockStream);
      await saveStreamToDatabase(mockStream.streamKey);
      
      toast({
        title: "Stream Created",
        description: "Your stream has been created successfully",
      });
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast({
        title: "Error",
        description: "Failed to create stream",
        variant: "destructive",
      });
    } finally {
      setIsCreatingStream(false);
    }
  };

  const handleStartStream = async () => {
    if (!streamData || !user) return;

    try {
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
    if (!streamData || !user) return;

    try {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Livestream Dashboard</h1>
        <Badge variant={isStreaming ? "default" : "secondary"}>
          {isStreaming ? "LIVE" : "OFFLINE"}
        </Badge>
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
              
              {!streamData ? (
                <Button 
                  onClick={handleCreateStream} 
                  disabled={isCreatingStream}
                  className="w-full"
                >
                  {isCreatingStream ? "Creating..." : "Create Stream"}
                </Button>
              ) : (
                <div className="space-y-4">
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
