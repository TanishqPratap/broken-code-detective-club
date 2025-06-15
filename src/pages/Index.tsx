
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, TrendingUp, Shield, Compass, Video, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import PostFeed from "@/components/PostFeed";
import Footer from "@/components/Footer";
import StoriesCarousel from "@/components/StoriesCarousel";
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
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show feed for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-2">
              Welcome back!
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">Ready to create amazing content?</p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button size="lg" onClick={() => navigate("/creator")} className="w-full sm:w-auto">
                <Video className="w-5 h-5 mr-2" />
                Creator Dashboard
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/discover")} className="w-full sm:w-auto">
                <Compass className="w-5 h-5 mr-2" />
                Discover Content
              </Button>
            </div>
          </div>

          {/* Stories Section */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-gray-100">Stories</h2>
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <StoriesCarousel />
              </CardContent>
            </Card>
          </div>

          {/* Feed Content */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-gray-100">Latest Posts</h2>
            <PostFeed />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 px-2">
            <Card className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Community</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connect with your audience</p>
              </CardContent>
            </Card>
            
            <Card className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Earnings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Multiple revenue streams</p>
              </CardContent>
            </Card>
            
            <Card className="text-center sm:col-span-2 lg:col-span-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Security</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your content is protected</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Footer />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // Clean marketing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Create. Connect. Earn.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            The ultimate platform for content creators to build their community and monetize their passion through subscriptions and exclusive content.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" onClick={handleGetStarted}>
              <Play className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" onClick={() => navigate("/discover")}>
              <Compass className="w-5 h-5 mr-2" />
              Explore Creators
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 dark:text-gray-400">
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
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 sm:mb-16 text-gray-900 dark:text-gray-100">Everything you need to succeed</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <Users className="w-10 sm:w-12 h-10 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">Build Community</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Connect directly with your audience through exclusive content and personal interactions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <TrendingUp className="w-10 sm:w-12 h-10 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">Multiple Revenue Streams</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Earn through subscriptions, tips, exclusive content, and live streaming
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg sm:col-span-2 lg:col-span-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <Shield className="w-10 sm:w-12 h-10 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">Secure Platform</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Advanced security features protect your content and ensure safe transactions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">Ready to start your journey?</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-2">
            Join thousands of creators who are already building their communities and earning from their passion.
          </p>
          <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" onClick={handleGetStarted}>
            Get Started Today
          </Button>
        </div>
      </section>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
