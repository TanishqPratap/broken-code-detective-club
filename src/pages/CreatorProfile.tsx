
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import TrailerViewer from "@/components/TrailerViewer";
import PaidDMModal from "@/components/PaidDMModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Star, MessageSquare, UserPlus, Heart, UserMinus } from "lucide-react";

interface CreatorProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  subscription_price: number;
  chat_rate: number;
  is_verified: boolean;
  subscriber_count: number;
  is_subscribed: boolean;
}

const CreatorProfile = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaidDMModal, setShowPaidDMModal] = useState(false);

  useEffect(() => {
    if (creatorId) {
      fetchCreatorProfile();
    }
  }, [creatorId, user]);

  const fetchCreatorProfile = async () => {
    if (!creatorId) return;

    try {
      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (profileError) throw profileError;

      // Get subscriber count
      const { count: subscriberCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      // Check if current user is subscribed
      let isSubscribed = false;
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('subscriber_id', user.id)
          .eq('status', 'active')
          .single();
        
        isSubscribed = !!subscription;
      }

      setCreator({
        ...profileData,
        subscriber_count: subscriberCount || 0,
        is_subscribed: isSubscribed
      });
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      toast({
        title: "Error",
        description: "Failed to load creator profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!creator) return;

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: user.id,
          creator_id: creator.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Subscribed successfully!",
        description: `You are now subscribed to ${creator.display_name}`,
      });

      // Refresh creator data
      await fetchCreatorProfile();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Subscription failed",
        description: "There was an error processing your subscription.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user || !creator) return;

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('creator_id', creator.id)
        .eq('subscriber_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: "Unsubscribed successfully",
        description: `You have unsubscribed from ${creator.display_name}`,
      });

      // Refresh creator data
      await fetchCreatorProfile();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Unsubscribe failed",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleStartPaidDM = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowPaidDMModal(true);
  };

  const handlePaidDMSessionCreated = (sessionId: string) => {
    navigate(`/dm?session=${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading creator profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
            <Button onClick={() => navigate('/discover')}>
              Back to Discover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Creator Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={creator.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {creator.display_name?.[0] || creator.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <CardTitle className="text-2xl">{creator.display_name || creator.username}</CardTitle>
                  {creator.is_verified && (
                    <Badge variant="secondary">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">@{creator.username}</p>
                <CardDescription className="mb-4">{creator.bio}</CardDescription>
                
                <div className="flex items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{creator.subscriber_count} subscribers</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {creator.is_subscribed ? (
                  <div className="flex flex-col gap-2">
                    <Badge variant="default" className="px-4 py-2 justify-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Subscribed
                    </Badge>
                    <Button 
                      variant="outline" 
                      onClick={handleUnsubscribe} 
                      disabled={subscribing}
                      size="sm"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      {subscribing ? "Unsubscribing..." : "Unsubscribe"}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleSubscribe} disabled={subscribing} size="lg">
                    <UserPlus className="w-4 h-4 mr-2" />
                    {subscribing ? "Subscribing..." : `Subscribe - $${creator.subscription_price}/month`}
                  </Button>
                )}
                
                {creator.chat_rate && (
                  <Button 
                    variant="outline" 
                    onClick={handleStartPaidDM}
                    size="lg"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Paid DM - ${creator.chat_rate}/hour
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Separator className="my-8" />

        {/* Trailer Content */}
        <TrailerViewer 
          creatorId={creator.id}
          creatorName={creator.display_name || creator.username}
          subscriptionPrice={creator.subscription_price}
          onSubscribe={creator.is_subscribed ? undefined : handleSubscribe}
        />
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {creator && user && (
        <PaidDMModal
          open={showPaidDMModal}
          onClose={() => setShowPaidDMModal(false)}
          creatorId={creator.id}
          creatorName={creator.display_name || creator.username}
          chatRate={creator.chat_rate || 0}
          subscriberId={user.id}
          onSessionCreated={handlePaidDMSessionCreated}
        />
      )}
    </div>
  );
};

export default CreatorProfile;
