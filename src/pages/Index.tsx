
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, TrendingUp, Shield, Compass, Video, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import PostFeed from "@/components/PostFeed";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  // Show feed for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="text-xl text-gray-600 mb-8">Ready to create amazing content?</p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={() => navigate("/creator")}>
                <Video className="w-5 h-5 mr-2" />
                Creator Dashboard
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/discover")}>
                <Compass className="w-5 h-5 mr-2" />
                Discover Content
              </Button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Latest Posts</h2>
            <PostFeed />
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Community</h3>
                <p className="text-sm text-gray-600">Connect with your audience</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Earnings</h3>
                <p className="text-sm text-gray-600">Multiple revenue streams</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Security</h3>
                <p className="text-sm text-gray-600">Your content is protected</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // Clean marketing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create. Connect. Earn.
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The ultimate platform for content creators to build their community and monetize their passion through subscriptions and exclusive content.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-16">
            <Button size="lg" className="text-lg px-8 py-4" onClick={handleGetStarted}>
              <Play className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4" onClick={() => navigate("/discover")}>
              <Compass className="w-5 h-5 mr-2" />
              Explore Creators
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>Trusted by creators</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Growing community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Everything you need to succeed</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Build Community</CardTitle>
                <CardDescription className="text-base">
                  Connect directly with your audience through exclusive content and personal interactions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Multiple Revenue Streams</CardTitle>
                <CardDescription className="text-base">
                  Earn through subscriptions, tips, exclusive content, and live streaming
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Secure Platform</CardTitle>
                <CardDescription className="text-base">
                  Advanced security features protect your content and ensure safe transactions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start your journey?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of creators who are already building their communities and earning from their passion.
          </p>
          <Button size="lg" className="text-lg px-8 py-4" onClick={handleGetStarted}>
            Get Started Today
          </Button>
        </div>
      </section>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
