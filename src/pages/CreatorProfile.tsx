
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import SubscriptionPaymentModal from "@/components/SubscriptionPaymentModal";
import PaidDMModal from "@/components/PaidDMModal";
import CreatorProfile from "@/components/CreatorProfile";
import TrailerPreviewCard from "@/components/TrailerPreviewCard";
import { useToast } from "@/hooks/use-toast";

interface CreatorData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  subscription_price: number;
  is_verified: boolean;
  chat_rate?: number;
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

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData();
      fetchTrailers();
    }
  }, [creatorId, user]);

  const fetchCreatorData = async () => {
    if (!creatorId) return;

    try {
      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, subscription_price, is_verified, chat_rate')
        .eq('id', creatorId)
        .single();

      if (profileError) throw profileError;

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
        ...profileData,
        subscriber_count: subscriberCount || 0,
        post_count: postCount || 0,
        is_subscribed: isSubscribed
      });
    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast({
        title: "Error",
        description: "Failed to load creator profile",
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
            <p className="text-gray-600">The requested creator profile could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
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
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Free Previews</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trailers.map((trailer) => (
              <TrailerPreviewCard key={trailer.id} trailer={trailer} />
            ))}
          </div>
        </div>
      )}

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
            chatRate={creator.chat_rate || 0}
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
