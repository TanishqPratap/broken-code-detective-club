
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const NotFound = () => {
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="text-6xl sm:text-8xl font-bold text-primary mb-4">404</div>
              <CardTitle className="text-xl sm:text-2xl mb-2">Page Not Found</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Oops! The page you're looking for doesn't exist or has been moved.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The URL <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code> could not be found.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/discover">
                    <Search className="w-4 h-4 mr-2" />
                    Discover Creators
                  </Link>
                </Button>
                
                <Button variant="ghost" onClick={() => window.history.back()} className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
              
              <div className="pt-6 border-t">
                <p className="text-xs text-muted-foreground mb-4">
                  If you think this is an error, please check the URL or try these popular pages:
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="link" size="sm" asChild>
                    <Link to="/posts">Posts</Link>
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/creator">Creator Dashboard</Link>
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/profile">Profile</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default NotFound;
