
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Play, Clock, Heart, UserPlus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

interface Creator {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  subscription_price: number;
  is_verified: boolean;
  subscriber_count?: number;
  is_subscribed?: boolean;
}

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchLiveStreams(), fetchCreators()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        .limit(12);

      if (error) throw error;
      
      const typedStreams: LiveStream[] = (data || []).map(stream => ({
        ...stream,
        status: (stream.status === 'live' ? 'live' : 'offline') as 'live' | 'offline'
      }));
      
      setLiveStreams(typedStreams);
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  };

  const fetchCreators = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, subscription_price, is_verified')
        .not('subscription_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      if (!profilesData) {
        setCreators([]);
        return;
      }

      // For each creator, check if current user is subscribed and get subscriber count
      const creatorsWithDetails = await Promise.all(
        profilesData.map(async (creator) => {
          // Get subscriber count
          const { count: subscriberCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.id)
            .eq('status', 'active');

          // Check if current user is subscribed
          let isSubscribed = false;
          if (user) {
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('creator_id', creator.id)
              .eq('subscriber_id', user.id)
              .eq('status', 'active')
              .single();
            
            isSubscribed = !!subscription;
          }

          return {
            ...creator,
            subscriber_count: subscriberCount || 0,
            is_subscribed: isSubscribed
          };
        })
      );

      setCreators(creatorsWithDetails);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  const handleWatchStream = (streamId: string) => {
    navigate(`/watch/${streamId}`);
  };

  const handleSubscribe = async (creatorId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setSubscribing(creatorId);
    try {
      // For now, just create a subscription record
      // In a real app, this would integrate with payment processing
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: user.id,
          creator_id: creatorId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) throw error;

      toast({
        title: "Subscribed successfully!",
        description: "You are now subscribed to this creator.",
      });

      // Refresh creators data
      await fetchCreators();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Subscription failed",
        description: "There was an error processing your subscription.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handleUnsubscribe = async (creatorId: string) => {
    if (!user) return;

    setSubscribing(creatorId);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('creator_id', creatorId)
        .eq('subscriber_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: "Unsubscribed successfully",
        description: "You have unsubscribed from this creator.",
      });

      // Refresh creators data
      await fetchCreators();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Unsubscribe failed",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover</h1>
          <p className="text-gray-600">Find amazing creators and live streams</p>
        </div>

        <Tabs defaultValue="creators" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="streams">Live Streams</TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator) => (
                <Card key={creator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={creator.avatar_url} />
                        <AvatarFallback>
                          {creator.display_name?.[0] || creator.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 justify-center">
                          <CardTitle className="text-lg">{creator.display_name || creator.username}</CardTitle>
                          {creator.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Heart className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{creator.username}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-3 text-center">
                      {creator.bio || "No bio available"}
                    </CardDescription>
                    
                    <div className="flex items-center justify-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{creator.subscriber_count} subscribers</span>
                      </div>
                      <div className="text-primary font-semibold">
                        ${creator.subscription_price}/month
                      </div>
                    </div>

                    {creator.is_subscribed ? (
                      <Button 
                        onClick={() => handleUnsubscribe(creator.id)}
                        className="w-full"
                        variant="outline"
                        disabled={subscribing === creator.id}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        {subscribing === creator.id ? "Processing..." : "Subscribed"}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSubscribe(creator.id)}
                        className="w-full"
                        disabled={subscribing === creator.id}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {subscribing === creator.id ? "Subscribing..." : "Subscribe"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {creators.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-2">No creators found</h3>
                <p className="text-gray-600">Be the first to become a creator!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="streams" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  
                  <CardHeader>
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

                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-2">
                      {stream.description || "No description available"}
                    </CardDescription>
                    <Button 
                      onClick={() => handleWatchStream(stream.id)}
                      className="w-full"
                      variant={stream.status === 'live' ? "default" : "outline"}
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
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Discover;
