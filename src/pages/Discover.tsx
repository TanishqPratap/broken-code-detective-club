
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import SubscriptionPaymentModal from "@/components/SubscriptionPaymentModal";
import PaidDMModal from "@/components/PaidDMModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Play, Clock, Heart, UserPlus, UserCheck, MessageSquare } from "lucide-react";
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
  chat_rate?: number;
}

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPaidDMModal, setShowPaidDMModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('id, username, display_name, bio, avatar_url, subscription_price, is_verified, chat_rate')
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

  const handleSubscribe = (creator: Creator) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setSelectedCreator(creator);
    setShowSubscriptionModal(true);
  };

  const handlePaidDM = (creator: Creator) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setSelectedCreator(creator);
    setShowPaidDMModal(true);
  };

  const handleUnsubscribe = async (creatorId: string) => {
    if (!user) return;

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
    }
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    setSelectedCreator(null);
    fetchCreators(); // Refresh data
    toast({
      title: "Subscription Successful!",
      description: "You are now subscribed to this creator.",
    });
  };

  const handlePaidDMSuccess = () => {
    setShowPaidDMModal(false);
    setSelectedCreator(null);
    toast({
      title: "Payment Successful!",
      description: "You can now send a paid message to this creator.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Discover</h1>
          <p className="text-sm sm:text-base text-gray-600">Find amazing creators and live streams</p>
        </div>

        <Tabs defaultValue="creators" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="creators" className="text-sm sm:text-base">Creators</TabsTrigger>
            <TabsTrigger value="streams" className="text-sm sm:text-base">Live Streams</TabsTrigger>
          </TabsList>

          <TabsContent value="creators">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator) => (
                <Card 
                  key={creator.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/creator/${creator.id}`)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                        <AvatarImage src={creator.avatar_url} />
                        <AvatarFallback>
                          {creator.display_name?.[0] || creator.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 justify-center">
                          <CardTitle className="text-base sm:text-lg">{creator.display_name || creator.username}</CardTitle>
                          {creator.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Heart className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">@{creator.username}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="mb-3 sm:mb-4 line-clamp-3 text-center text-xs sm:text-sm">
                      {creator.bio || "No bio available"}
                    </CardDescription>
                    
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{creator.subscriber_count} subs</span>
                      </div>
                      <div className="text-primary font-semibold">
                        ${creator.subscription_price}/mo
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {creator.is_subscribed ? (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnsubscribe(creator.id);
                          }}
                          className="flex-1 text-xs sm:text-sm"
                          variant="outline"
                          size="sm"
                        >
                          <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Subscribed</span>
                          <span className="sm:hidden">Sub'd</span>
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubscribe(creator);
                          }}
                          className="flex-1 text-xs sm:text-sm"
                          size="sm"
                        >
                          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Subscribe</span>
                          <span className="sm:hidden">Sub</span>
                        </Button>
                      )}
                      {creator.chat_rate && (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaidDM(creator);
                          }}
                          variant="outline"
                          size="sm"
                          className="p-2"
                          title={`Paid DM - $${creator.chat_rate}/hour`}
                        >
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {creators.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No creators found</h3>
                <p className="text-sm sm:text-base text-gray-600">Be the first to become a creator!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="streams">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white/60" />
                    </div>
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <Badge variant={stream.status === 'live' ? "default" : "secondary"} className="text-xs">
                        {stream.status === 'live' ? (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1 sm:mr-2" />
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
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/30 text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {stream.viewer_count}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                        <AvatarImage src={stream.profiles?.avatar_url} />
                        <AvatarFallback>
                          {stream.profiles?.display_name?.[0] || stream.profiles?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-lg truncate">{stream.title}</CardTitle>
                        <p className="text-xs sm:text-sm text-gray-600">@{stream.profiles?.username}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="mb-3 sm:mb-4 line-clamp-2 text-xs sm:text-sm">
                      {stream.description || "No description available"}
                    </CardDescription>
                    <Button 
                      onClick={() => handleWatchStream(stream.id)}
                      className="w-full text-xs sm:text-sm"
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
              <div className="text-center py-12 sm:py-16">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No streams available</h3>
                <p className="text-sm sm:text-base text-gray-600">Check back later for live content!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {selectedCreator && (
        <>
          <SubscriptionPaymentModal
            isOpen={showSubscriptionModal}
            onClose={() => {
              setShowSubscriptionModal(false);
              setSelectedCreator(null);
            }}
            creatorId={selectedCreator.id}
            creatorName={selectedCreator.display_name || selectedCreator.username}
            subscriptionPrice={selectedCreator.subscription_price}
            onSubscriptionSuccess={handleSubscriptionSuccess}
          />

          <PaidDMModal
            open={showPaidDMModal}
            onClose={() => {
              setShowPaidDMModal(false);
              setSelectedCreator(null);
            }}
            creatorId={selectedCreator.id}
            creatorName={selectedCreator.display_name || selectedCreator.username}
            chatRate={selectedCreator.chat_rate || 0}
            subscriberId={user?.id || ''}
            onSessionCreated={(sessionId) => {
              console.log('Chat session created:', sessionId);
              handlePaidDMSuccess();
            }}
          />
        </>
      )}
    </div>
  );
};

export default Discover;
