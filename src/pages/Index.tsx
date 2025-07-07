import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, TrendingUp, Shield, Compass, Video, Play } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import PostFeed from "@/components/PostFeed";
import Footer from "@/components/Footer";
import StoriesCarousel from "@/components/StoriesCarousel";
import VideoHero from "@/components/VideoHero";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <div className={`container mx-auto max-w-4xl ${isMobile ? '' : 'px-4 py-6 sm:py-8'}`}>
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text px-2 text-sky-500">Welcome</h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">Ready For Amazing Content?</p>
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
          
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-gray-100">Stories</h2>
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <StoriesCarousel />
              </CardContent>
            </Card>
          </div>
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-gray-100">Latest Posts</h2>
            <PostFeed />
          </div>
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
        {!isMobile && <Footer />}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Video Hero Section */}
      {!isMobile && <VideoHero />}
      
      {/* Rest of the content */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <section className={`container mx-auto px-4 py-12 sm:py-16 lg:py-20 ${isMobile ? 'pt-4' : ''}`}>
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
        
        {!isMobile && <Footer />}
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
