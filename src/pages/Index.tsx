import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, TrendingUp, Shield, Compass, Video } from "lucide-react";
import CreatorProfile from "@/components/CreatorProfile";
import SubscriptionCard from "@/components/SubscriptionCard";
import ContentFeed from "@/components/ContentFeed";
import CreatorDashboard from "@/components/CreatorDashboard";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const subscriptionTiers = [
    {
      id: "basic",
      name: "Basic",
      price: 9.99,
      description: "Essential features for getting started",
      features: ["Access to basic content", "Monthly updates", "Community access"],
    },
    {
      id: "premium",
      name: "Premium",
      price: 19.99,
      description: "Advanced features for serious creators",
      features: ["All basic features", "Premium content", "Priority support", "Advanced analytics"],
      isPopular: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: 39.99,
      description: "Complete solution for professional creators",
      features: ["All premium features", "Custom branding", "API access", "1-on-1 support"],
    }
  ];

  const samplePosts = [
    {
      id: "1",
      creator: {
        username: "sarah_creator",
        displayName: "Sarah Johnson",
        avatar: "",
        isVerified: true,
      },
      content: {
        type: "image" as const,
        text: "Just finished my latest photoshoot! What do you think? 📸✨",
      },
      isLocked: !user,
      likes: 142,
      comments: 23,
      timestamp: "2 hours ago",
      isLiked: false,
    },
    {
      id: "2",
      creator: {
        username: "mike_fitness",
        displayName: "Mike Thompson",
        avatar: "",
        isVerified: false,
      },
      content: {
        type: "video" as const,
        text: "New workout routine dropping tomorrow! Get ready to sweat 💪",
      },
      isLocked: false,
      likes: 89,
      comments: 15,
      timestamp: "4 hours ago",
      isLiked: true,
    },
  ];

  const sampleCreator = {
    id: "1",
    username: "sarah_creator",
    displayName: "Sarah Johnson",
    bio: "Professional photographer and content creator. Sharing behind-the-scenes moments and exclusive content with my amazing subscribers! 📸✨",
    avatar: "",
    coverImage: "",
    subscriberCount: 15420,
    postCount: 127,
    isSubscribed: !!user,
    subscriptionPrice: 19.99,
  };

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    console.log("Subscribing to tier:", tierId);
  };

  const handlePostAction = (postId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    console.log("Post action for:", postId);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/creator");
    } else {
      setShowAuthModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create. Connect. Monetize.
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The ultimate platform for content creators to build their community and generate income through subscriptions, tips, and exclusive content.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" onClick={handleGetStarted}>
            {user ? "Creator Dashboard" : "Get Started"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/discover")}>
            <Compass className="w-4 h-4 mr-2" />
            Discover Creators
          </Button>
          {user && (
            <Button variant="outline" size="lg" onClick={() => navigate("/creator")}>
              <Video className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          )}
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/discover")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Compass className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Discover Creators</CardTitle>
                  <CardDescription>Find amazing content and live streams</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {user && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/creator")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle>Creator Hub</CardTitle>
                    <CardDescription>Manage your content and go live</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ContentOasis?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Build Your Community</CardTitle>
              <CardDescription>
                Connect with fans and followers through exclusive content and direct messaging
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Multiple Revenue Streams</CardTitle>
              <CardDescription>
                Earn through subscriptions, tips, pay-per-view content, and live streaming
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Advanced security features to protect your content and maintain your privacy
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {subscriptionTiers.map((tier) => (
            <SubscriptionCard
              key={tier.id}
              tier={tier}
              onSubscribe={handleSubscribe}
              isSubscribed={false}
            />
          ))}
        </div>
      </section>

      {/* Sample Content Feed */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Discover Amazing Content</h2>
        <ContentFeed
          posts={samplePosts}
          onLike={handlePostAction}
          onComment={handlePostAction}
          onShare={handlePostAction}
        />
      </section>

      {/* Sample Creator Profile */}
      <section className="py-16">
        <div className="container mx-auto px-4 mb-12">
          <h2 className="text-3xl font-bold text-center">Featured Creator</h2>
        </div>
        <CreatorProfile creator={sampleCreator} />
      </section>

      {user && (
        <section className="py-16">
          <CreatorDashboard />
        </section>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
