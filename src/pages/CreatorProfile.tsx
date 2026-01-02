
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import SubscriptionPaymentModal from "@/components/SubscriptionPaymentModal";
import PaidDMModal from "@/components/PaidDMModal";
import CreatorProfile from "@/components/CreatorProfile";
import TrailerPreviewCard from "@/components/TrailerPreviewCard";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

interface CreatorData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  subscription_price: number;
  is_verified: boolean;
  chat_rate?: number;
  chat_rate_coins?: number;
  subscriber_count: number;
  post_count: number;
  is_subscribed: boolean;
}

interface TrailerContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  order_position: number;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    subscription_price: number | null;
  };
}

const CreatorProfilePage = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPaidDMModal, setShowPaidDMModal] = useState(false);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [trailers, setTrailers] = useState<TrailerContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (creatorId) {
      // Validate creatorId format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(creatorId)) {
        setError("Invalid creator ID format");
        setLoading(false);
        return;
      }
      
      fetchCreatorData();
      fetchTrailers();
    } else {
      setError("Creator ID is required");
      setLoading(false);
    }
  }, [creatorId, user]);

  const fetchCreatorData = async () => {
    if (!creatorId) return;

    try {
      setError(null);
      
      // Fetch creator profile using profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, subscription_price, is_verified, chat_rate, chat_rate_coins')
        .eq('id', creatorId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to fetch creator profile');
      }

      if (!profileData) {
        setError("Creator not found");
        setLoading(false);
        return;
      }

      // Get subscriber count
      const { count: subscriberCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      // Get post count (from content table)
      const { count: postCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId);

      // Check if current user is subscribed
      let isSubscribed = false;
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('subscriber_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        isSubscribed = !!subscription;
      }

      setCreator({
        id: profileData.id || '',
        username: profileData.username || '',
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        subscription_price: profileData.subscription_price || 0,
        is_verified: profileData.is_verified || false,
        chat_rate: profileData.chat_rate,
        chat_rate_coins: profileData.chat_rate_coins,
        subscriber_count: subscriberCount || 0,
        post_count: postCount || 0,
        is_subscribed: isSubscribed
      });
    } catch (error: any) {
      console.error('Error fetching creator data:', error);
      setError(error.message || 'Failed to load creator profile');
      toast({
        title: "Error",
        description: error.message || "Failed to load creator profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrailers = async () => {
    if (!creatorId) return;

    try {
      const { data: trailersData, error: trailersError } = await supabase
        .from('trailer_content')
        .select(`
          id,
          title,
          description,
          content_type,
          media_url,
          order_position,
          created_at,
          creator_id
        `)
        .eq('creator_id', creatorId)
        .order('order_position', { ascending: true });

      if (trailersError) throw trailersError;

      // Get creator info for trailers
      const { data: creatorInfo } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified, subscription_price')
        .eq('id', creatorId)
        .single();

      const trailersWithCreator = (trailersData || []).map(trailer => ({
        ...trailer,
        creator: {
          id: creatorInfo?.id || creatorId,
          username: creatorInfo?.username || '',
          display_name: creatorInfo?.display_name,
          avatar_url: creatorInfo?.avatar_url,
          is_verified: creatorInfo?.is_verified || false,
          subscription_price: creatorInfo?.subscription_price
        }
      }));

      setTrailers(trailersWithCreator);
    } catch (error) {
      console.error('Error fetching trailers:', error);
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowSubscriptionModal(true);
  };

  const handleStartPaidDM = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowPaidDMModal(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    fetchCreatorData(); // Refresh creator data
    toast({
      title: "Subscription Successful!",
      description: `You are now subscribed to ${creator?.display_name || creator?.username}`,
    });
  };

  const handlePaidDMSuccess = () => {
    setShowPaidDMModal(false);
    toast({
      title: "Payment Successful!",
      description: "You can now send a paid message to this creator.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 ml-64">
          <div className="w-full min-h-screen px-4 py-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm sm:text-base">Loading creator profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 ml-64">
          <div className="w-full min-h-screen px-4 py-6">
            <div className="text-center max-w-md mx-auto">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-xl sm:text-2xl font-bold mb-4">
                {error === "Creator not found" ? "Creator Not Found" : "Something went wrong"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                {error === "Creator not found" 
                  ? "The creator you're looking for doesn't exist or may have been removed."
                  : error || "We couldn't load this creator's profile. Please try again."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/discover">Discover Creators</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Go Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const creatorTitle = `${creator.display_name || creator.username} - Content Creator`;
  const creatorDescription = creator.bio || `Check out ${creator.display_name || creator.username}'s exclusive content and trailers`;
  const creatorImage = creator.avatar_url || "/placeholder.svg";
  const creatorUrl = `${window.location.origin}/creator/${creator.id}`;

  return (
    <div className="min-h-screen bg-white flex">
      <SEOHead
        title={creatorTitle}
        description={creatorDescription}
        image={creatorImage}
        url={creatorUrl}
        type="profile"
      />
      
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      <main className="flex-1 ml-64 bg-white">
        <div className="w-full bg-white">
          <CreatorProfile
            creator={{
              id: creator.id,
              username: creator.username,
              displayName: creator.display_name,
              bio: creator.bio || "",
              avatar: creator.avatar_url || "",
              coverImage: "",
              subscriberCount: creator.subscriber_count,
              postCount: creator.post_count,
              isSubscribed: creator.is_subscribed,
              subscriptionPrice: creator.subscription_price
            }}
            onSubscribe={handleSubscribe}
            onStartPaidDM={creator.chat_rate ? handleStartPaidDM : undefined}
          />

          {/* Trailers Section */}
          {trailers.length > 0 && (
            <div className="w-full bg-white">
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-8 bg-white">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Free Previews</h2>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {trailers.map((trailer) => (
                    <TrailerPreviewCard key={trailer.id} trailer={trailer} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {creator && (
        <>
          <SubscriptionPaymentModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            creatorId={creator.id}
            creatorName={creator.display_name || creator.username}
            subscriptionPrice={creator.subscription_price}
            onSubscriptionSuccess={handleSubscriptionSuccess}
          />

          <PaidDMModal
            open={showPaidDMModal}
            onClose={() => setShowPaidDMModal(false)}
            creatorId={creator.id}
            creatorName={creator.display_name || creator.username}
            chatRateCoins={creator.chat_rate_coins || 0}
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

export default CreatorProfilePage;
